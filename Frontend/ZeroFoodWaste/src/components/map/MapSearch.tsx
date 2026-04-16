import { useState, useEffect } from "react";
import { Search, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  searchPlaces,
  type GeocodingResult,
} from "@/services/geocodingService";
import { toast } from "@/hooks/use-toast";

interface MapSearchProps {
  onLocationSelect: (location: GeocodingResult) => void;
  disabled?: boolean;
}

export function MapSearch({
  onLocationSelect,
  disabled = false,
}: MapSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const places = await searchPlaces(searchQuery);
        setResults(places);

        if (places.length === 0) {
          setError("No locations found. Try a different search term.");
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search locations. Please try again.");
        toast({
          title: "Search Error",
          description: "Failed to search for locations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (location: GeocodingResult) => {
    onLocationSelect(location);
    setSearchQuery("");
    setResults([]);
    setIsOpen(false);
    toast({
      title: "Location Selected",
      description: `Moving map to ${location.displayName}`,
    });
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeocodingResult = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Your Location",
            displayName: "Your Current Location",
          };
          onLocationSelect(location);
          setIsLoading(false);
          toast({
            title: "Location Updated",
            description: "Using your current location",
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Could not get your location. Please check permissions.");
          setIsLoading(false);
          toast({
            title: "Geolocation Error",
            description: "Could not access your location",
            variant: "destructive",
          });
        },
      );
    } else {
      setError("Geolocation is not supported by your browser");
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search address or location..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled || isLoading}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (searchQuery.length >= 3 || results.length > 0 || error) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Use Current Location Button */}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start px-4 py-2 rounded-none text-sm"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
          >
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            Use My Current Location
          </Button>

          {/* Search Results */}
          {isLoading && (
            <div className="px-4 py-8 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="border-t">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-4 py-2 hover:bg-accent border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {result.address}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.displayName}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && searchQuery.length >= 3 && (
            <div className="px-4 py-4 flex items-center text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
              {error}
            </div>
          )}

          {/* Empty State */}
          {!isLoading &&
            results.length === 0 &&
            !error &&
            searchQuery.length >= 3 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No locations found. Try a different search.
              </div>
            )}

          {/* Hint Text */}
          {searchQuery.length < 3 && results.length === 0 && !error && (
            <div className="px-4 py-4 text-xs text-muted-foreground">
              Type at least 3 characters to search
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
