import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Scale,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Route,
} from "lucide-react";
import { OpenStreetMapComponent } from "@/components/map/OpenStreetMap";
import { MapSearch } from "@/components/map/MapSearch";
import { useMapData, type MapMarker } from "@/hooks/useMapData";
import { toast } from "@/hooks/use-toast";
import {
  calculateDistance,
  formatDistance,
  type GeocodingResult,
} from "@/services/geocodingService";

/** Haversine: find the closest NGO for a given donation */
function findNearestNGO(
  donation: MapMarker,
  ngos: MapMarker[]
): { ngo: MapMarker; distanceKm: number } | null {
  if (!ngos.length) return null;
  let nearest = ngos[0];
  let nearestDist = calculateDistance(
    donation.latitude,
    donation.longitude,
    nearest.latitude,
    nearest.longitude
  );
  for (const ngo of ngos) {
    const d = calculateDistance(
      donation.latitude,
      donation.longitude,
      ngo.latitude,
      ngo.longitude
    );
    if (d < nearestDist) {
      nearestDist = d;
      nearest = ngo;
    }
  }
  return { ngo: nearest, distanceKm: nearestDist };
}

const MapPage = () => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "donation" | "ngo" | "volunteer"
  >("all");
  const [showMatchLine, setShowMatchLine] = useState(true);

  const {
    markers,
    isLoading: dataLoading,
    error: dataError,
    refetch,
  } = useMapData();

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 27.7172, lng: 85.324 });
        }
      );
    } else {
      setUserLocation({ lat: 27.7172, lng: 85.324 });
    }
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (filterType !== "all" && m.type !== filterType) return false;
    return true;
  });

  const donations = markers.filter((m) => m.type === "donation");
  const ngos = markers.filter((m) => m.type === "ngo");

  /** Find the best donation<->NGO pair to draw a polyline for */
  const nearestNGOLine = useMemo(() => {
    if (!showMatchLine || !donations.length || !ngos.length) return null;

    // If a donation is selected, draw a line from that donation to its nearest NGO
    if (selectedMarker?.type === "donation") {
      const result = findNearestNGO(selectedMarker, ngos);
      if (result) return { donation: selectedMarker, ngo: result.ngo };
    }

    // Otherwise draw the first available donation → nearest NGO
    const result = findNearestNGO(donations[0], ngos);
    if (result) return { donation: donations[0], ngo: result.ngo };

    return null;
  }, [showMatchLine, selectedMarker, donations, ngos]);

  const calculateDistanceToMarker = (marker: MapMarker) => {
    if (!userLocation) return null;
    const distanceKm = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      marker.latitude,
      marker.longitude
    );
    return formatDistance(distanceKm);
  };

  const handleLocationSearch = (location: GeocodingResult) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    toast({
      title: "Location Updated",
      description: `Map centered at ${location.displayName}`,
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing map data...",
      description: "Loading latest donations and locations",
    });
    refetch();
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading map data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 h-screen flex flex-col">
        <div className="flex-1 relative">
          <OpenStreetMapComponent
            markers={filteredMarkers}
            userLocation={userLocation}
            onMarkerClick={setSelectedMarker}
            selectedMarkerId={selectedMarker?.id}
            nearestNGOLine={nearestNGOLine}
          />

          {/* Search and Filters Overlay */}
          <div className="absolute top-4 left-4 right-4 z-[1000]">
            <div className="flex gap-3 flex-wrap items-start">
              <MapSearch
                onLocationSelect={handleLocationSearch}
                disabled={false}
              />
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { key: "all", label: `All (${markers.length})` },
                    {
                      key: "donation",
                      label: `🍎 Donations (${markers.filter((m) => m.type === "donation").length})`,
                    },
                    {
                      key: "ngo",
                      label: `🏢 NGOs (${markers.filter((m) => m.type === "ngo").length})`,
                    },
                    {
                      key: "volunteer",
                      label: `🚴 Volunteers (${markers.filter((m) => m.type === "volunteer").length})`,
                    },
                  ] as { key: "all" | "donation" | "ngo" | "volunteer"; label: string }[]
                ).map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filterType === key ? "default" : "secondary"}
                    onClick={() => setFilterType(key)}
                    className="h-10 shadow-lg text-sm"
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  variant={showMatchLine ? "default" : "outline"}
                  onClick={() => setShowMatchLine((v) => !v)}
                  className="h-10 shadow-lg text-sm"
                  title="Toggle NGO matching line"
                >
                  <Route className="w-4 h-4 mr-1" />
                  Match
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="h-10 shadow-lg"
                  title="Refresh map data"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Data Error Banner */}
          {dataError && (
            <div className="absolute top-20 left-4 right-4 z-[1000]">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="text-destructive">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Error loading map data
                    </p>
                    <p className="text-xs text-muted-foreground">{dataError}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* No Markers Message */}
          {!dataError && markers.length === 0 && (
            <div className="absolute top-20 left-4 right-4 z-[1000]">
              <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No locations found on the map. Add some donations to get
                    started.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {/* Nearest NGO match info */}
          {nearestNGOLine && showMatchLine && (
            <div className="absolute bottom-48 left-4 z-[1000]">
              <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-3 border border-indigo-200 text-sm">
                <p className="font-semibold text-indigo-600 flex items-center gap-1">
                  <Route className="w-4 h-4" />
                  Nearest NGO Match
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {nearestNGOLine.ngo.title}
                </p>
                <p className="text-xs font-medium text-indigo-500 mt-0.5">
                  {formatDistance(
                    calculateDistance(
                      nearestNGOLine.donation.latitude,
                      nearestNGOLine.donation.longitude,
                      nearestNGOLine.ngo.latitude,
                      nearestNGOLine.ngo.longitude
                    )
                  )}{" "}
                  away
                </p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Legend</p>
              <div className="space-y-2">
                {[
                  {
                    color: "bg-emerald-500",
                    label: `Donations (${markers.filter((m) => m.type === "donation").length})`,
                  },
                  {
                    color: "bg-blue-500",
                    label: `NGOs (${markers.filter((m) => m.type === "ngo").length})`,
                  },
                  {
                    color: "bg-amber-500",
                    label: `Volunteers (${markers.filter((m) => m.type === "volunteer").length})`,
                  },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${color} flex-shrink-0`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
                {userLocation && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">You</span>
                  </div>
                )}
                {nearestNGOLine && showMatchLine && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-indigo-500 flex-shrink-0" style={{ width: "1rem" }} />
                    <span className="text-xs text-muted-foreground">
                      NGO Match
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected marker details */}
          {selectedMarker && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4"
            >
              <div className="bg-card rounded-2xl shadow-xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        selectedMarker.type === "donation"
                          ? "bg-emerald-100"
                          : selectedMarker.type === "ngo"
                            ? "bg-blue-100"
                            : "bg-amber-100"
                      }`}
                    >
                      {selectedMarker.type === "donation"
                        ? "🍎"
                        : selectedMarker.type === "ngo"
                          ? "🏢"
                          : "🚴"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {selectedMarker.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {calculateDistanceToMarker(selectedMarker) ||
                          "Location available"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {selectedMarker.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedMarker.description}
                  </p>
                )}

                {selectedMarker.type === "donation" && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {selectedMarker.foodType && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary"
                      >
                        {selectedMarker.foodType}
                      </Badge>
                    )}
                    {selectedMarker.quantity && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        <Scale className="w-3 h-3 mr-1" />
                        {selectedMarker.quantity}{" "}
                        {selectedMarker.quantityUnit || "units"}
                      </Badge>
                    )}
                    {selectedMarker.expiryDate && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-700"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Expires{" "}
                        {new Date(
                          selectedMarker.expiryDate
                        ).toLocaleDateString()}
                      </Badge>
                    )}
                    {selectedMarker.status && (
                      <Badge variant="outline">{selectedMarker.status}</Badge>
                    )}
                  </div>
                )}

                {/* Nearest NGO for this donation */}
                {selectedMarker.type === "donation" && ngos.length > 0 && (() => {
                  const result = findNearestNGO(selectedMarker, ngos);
                  return result ? (
                    <div className="mb-3 p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                        <Route className="w-3 h-3" />
                        Nearest NGO: {result.ngo.title}
                        <span className="ml-auto text-indigo-400">
                          {formatDistance(result.distanceKm)}
                        </span>
                      </p>
                    </div>
                  ) : null;
                })()}

                {selectedMarker.donor?.name && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Donated by{" "}
                    <span className="font-medium">
                      {selectedMarker.donor.name}
                    </span>
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.open(
                        `https://www.openstreetmap.org/directions?from=${userLocation?.lat ?? ""},${userLocation?.lng ?? ""}&to=${selectedMarker.latitude},${selectedMarker.longitude}`,
                        "_blank"
                      );
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                  <Button variant="default" className="flex-1">
                    {selectedMarker.type === "donation" ? "Accept" : "Contact"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MapPage;
