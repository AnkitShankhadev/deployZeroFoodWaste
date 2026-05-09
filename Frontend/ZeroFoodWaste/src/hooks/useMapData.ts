import { useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface MapMarker {
  id: string;
  type: "donation" | "ngo" | "volunteer";
  title: string;
  latitude: number;
  longitude: number;
  status?: string;
  quantity?: number;
  quantityUnit?: string;
  expiryDate?: string;
  foodType?: string;
  organizationName?: string;
  description?: string;
  phone?: string;
  profileImage?: string;
  donor?: { name: string; phone?: string; profileImage?: string };
}

async function fetchPublic<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${endpoint}`);
  return res.json();
}

export function useMapData() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const allMarkers: MapMarker[] = [];

    // ── 1. Donations  (public endpoint) ─────────────────────────────────────
    try {
      const res = await fetchPublic<{
        success: boolean;
        data: { locations: any[] };
      }>("/donations/locations");

      if (res.success) {
        for (const d of res.data.locations ?? []) {
          const lat = Number(d.latitude);
          const lng = Number(d.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            allMarkers.push({
              id: String(d.id ?? d._id),
              type: "donation",
              title: d.foodType ?? "Food Donation",
              latitude: lat,
              longitude: lng,
              status: d.status,
              quantity: d.quantity,
              quantityUnit: d.quantityUnit,
              expiryDate: d.expiryDate,
              foodType: d.foodType,
              description: d.description,
              donor: d.donor,
              phone: d.donor?.phone,
              profileImage: d.donor?.profileImage,
            });
          }
        }
        console.log(
          `📦 Donations: ${allMarkers.filter((m) => m.type === "donation").length}`
        );
      }
    } catch (e) {
      console.warn("⚠️ Donations fetch failed:", e);
    }

    // ── 2. NGOs + Volunteers  (public endpoint) ──────────────────────────────
    try {
      const res = await fetchPublic<{
        success: boolean;
        data: { pins: any[] };
      }>("/users/map-pins");

      if (res.success) {
        for (const u of res.data.pins ?? []) {
          const lat = Number(u.latitude);
          const lng = Number(u.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            allMarkers.push({
              id: String(u.id ?? u._id),
              type: u.type as "ngo" | "volunteer",
              title: u.title ?? u.name ?? u.type,
              latitude: lat,
              longitude: lng,
              organizationName: u.title,
              description: u.description,
              phone: u.phone,
              profileImage: u.profileImage,
            });
          }
        }
        console.log(
          `🏢 NGOs: ${allMarkers.filter((m) => m.type === "ngo").length}  🚴 Volunteers: ${allMarkers.filter((m) => m.type === "volunteer").length}`
        );
      }
    } catch (e) {
      console.warn("⚠️ User map-pins fetch failed:", e);
    }

    console.log(`✅ Total map markers: ${allMarkers.length}`);
    setMarkers(allMarkers);

    if (allMarkers.length === 0) {
      setError("No locations found. Add donations to see them on the map.");
    } else {
      setError(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { markers, isLoading, error, refetch: fetchData };
}