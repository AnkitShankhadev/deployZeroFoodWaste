import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Clock,
  Scale,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Route,
  AlertCircle,
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
        <main className="h-screen flex items-center justify-center pt-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-slate-500 font-medium">Loading map data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col relative">
      <Navbar />

      <main className="flex-1 relative w-full h-full">
        <OpenStreetMapComponent
          markers={filteredMarkers}
          userLocation={userLocation}
          onMarkerClick={setSelectedMarker}
          selectedMarkerId={selectedMarker?.id}
          nearestNGOLine={nearestNGOLine}
        />

        {/* Search and Filters Overlay - Floating Nav Style */}
        <div className="absolute top-20 md:top-24 left-4 right-4 z-[1000] pointer-events-none">
          <div className="flex flex-col md:flex-row gap-4 items-start justify-center max-w-6xl mx-auto pointer-events-auto">
            {/* Search Bar Container */}
            <div className="w-full md:w-80 shadow-2xl shadow-slate-900/10 rounded-[1.5rem] bg-white/90 backdrop-blur-xl border border-white/50 p-1">
              <MapSearch
                onLocationSelect={handleLocationSearch}
                disabled={false}
              />
            </div>

            {/* Floating Filter Nav Bar */}
            <div className="flex gap-1.5 flex-wrap bg-white/90 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white/50 shadow-2xl shadow-slate-900/10">
              {(
                [
                  { key: "all", label: `All (${markers.length})` },
                  {
                    key: "donation",
                    label: `Donations (${markers.filter((m) => m.type === "donation").length})`,
                  },
                  {
                    key: "ngo",
                    label: `NGOs (${markers.filter((m) => m.type === "ngo").length})`,
                  },
                  {
                    key: "volunteer",
                    label: `Volunteers (${markers.filter((m) => m.type === "volunteer").length})`,
                  },
                ] as { key: "all" | "donation" | "ngo" | "volunteer"; label: string }[]
              ).map(({ key, label }) => (
                <Button
                  key={key}
                  variant="ghost"
                  onClick={() => setFilterType(key)}
                  className={`h-11 px-5 rounded-2xl text-sm font-bold transition-all duration-300 ${filterType === key
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                >
                  {label}
                </Button>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-1 self-center hidden sm:block"></div>
              <Button
                variant="ghost"
                onClick={() => setShowMatchLine((v) => !v)}
                className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all duration-300 ${showMatchLine
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80"
                  }`}
                title="Toggle NGO matching line"
              >
                <Route className="w-4 h-4 mr-2" /> Match
              </Button>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                className="h-11 w-11 p-0 rounded-2xl text-slate-600 hover:bg-slate-100/80 transition-all hover:text-emerald-600"
                title="Refresh map data"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Data Error Banner */}
        {dataError && (
          <div className="absolute top-40 left-4 right-4 z-[1000] pointer-events-none">
            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-red-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-2xl shadow-red-900/10 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Error loading map data
                  </p>
                  <p className="text-xs font-medium text-slate-500">{dataError}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl font-bold h-9">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* No Markers Message */}
        {!dataError && markers.length === 0 && (
          <div className="absolute top-40 left-4 right-4 z-[1000] pointer-events-none">
            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-2xl shadow-slate-900/10 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-700 leading-tight">
                  No locations found. Add some donations to get started.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl font-bold h-9">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Nearest NGO match info */}
        <AnimatePresence>
          {nearestNGOLine && showMatchLine && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute bottom-40 left-4 z-[1000]"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-900/10 p-4 border border-indigo-100 text-sm max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Route className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-indigo-700 leading-tight">Nearest Match</p>
                </div>
                <p className="text-slate-600 font-medium text-xs mb-1 line-clamp-2">
                  {nearestNGOLine.ngo.title}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg text-xs font-bold text-indigo-600 mt-1">
                  <Navigation className="w-3 h-3" />
                  {formatDistance(
                    calculateDistance(
                      nearestNGOLine.donation.latitude,
                      nearestNGOLine.donation.longitude,
                      nearestNGOLine.ngo.latitude,
                      nearestNGOLine.ngo.longitude
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-6 left-4 z-[1000]">
          <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-xl shadow-slate-900/5 p-5 border border-white/50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Map Legend</p>
            <div className="space-y-3">
              {[
                { color: "bg-emerald-500 shadow-emerald-500/50", label: `Donations (${markers.filter((m) => m.type === "donation").length})` },
                { color: "bg-blue-500 shadow-blue-500/50", label: `NGOs (${markers.filter((m) => m.type === "ngo").length})` },
                { color: "bg-amber-500 shadow-amber-500/50", label: `Volunteers (${markers.filter((m) => m.type === "volunteer").length})` },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${color} shadow-lg flex-shrink-0 border-2 border-white`} />
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                </div>
              ))}
              {userLocation && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50 border-2 border-white flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-600">Your Location</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected marker details */}
        <AnimatePresence>
          {selectedMarker && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4 pointer-events-none"
            >
              <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-900/20 border border-white/50 p-6 pointer-events-auto">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-inner border border-white/50 ${selectedMarker.type === "donation"
                          ? "bg-gradient-to-br from-emerald-100 to-emerald-50"
                          : selectedMarker.type === "ngo"
                            ? "bg-gradient-to-br from-blue-100 to-blue-50"
                            : "bg-gradient-to-br from-amber-100 to-amber-50"
                        }`}
                    >
                      {selectedMarker.type === "donation" ? "🍎" : selectedMarker.type === "ngo" ? "🏢" : "🚴"}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mb-1">
                        {selectedMarker.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {calculateDistanceToMarker(selectedMarker) || "Location available"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedMarker.description && (
                  <p className="text-sm font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedMarker.description}
                  </p>
                )}

                {selectedMarker.type === "donation" && (
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {selectedMarker.foodType && (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 font-bold px-2.5 py-1">
                        {selectedMarker.foodType}
                      </Badge>
                    )}
                    {selectedMarker.quantity && (
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-bold px-2.5 py-1 flex items-center">
                        <Scale className="w-3 h-3 mr-1.5" />
                        {selectedMarker.quantity} {selectedMarker.quantityUnit || "units"}
                      </Badge>
                    )}
                    {selectedMarker.expiryDate && (
                      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 font-bold px-2.5 py-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1.5" />
                        Exp: {new Date(selectedMarker.expiryDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Nearest NGO for this donation */}
                {selectedMarker.type === "donation" && ngos.length > 0 && (() => {
                  const result = findNearestNGO(selectedMarker, ngos);
                  return result ? (
                    <div className="mb-5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <Route className="w-3 h-3" />
                        </div>
                        <p className="text-xs font-bold text-indigo-900">
                          Nearest NGO: <span className="font-medium">{result.ngo.title}</span>
                        </p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none font-bold">
                        {formatDistance(result.distanceKm)}
                      </Badge>
                    </div>
                  ) : null;
                })()}

                {selectedMarker.donor?.name && (
                  <div className="flex items-center gap-2 mb-5 px-1">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {selectedMarker.donor.name.charAt(0)}
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      Donated by <span className="text-slate-800">{selectedMarker.donor.name}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
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
                  <Button className="flex-1 rounded-xl h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-transform hover:-translate-y-0.5">
                    {selectedMarker.type === "donation" ? "Accept Request" : "Contact Partner"}
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MapPage;
