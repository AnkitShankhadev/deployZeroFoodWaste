import { useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getAuthToken = (): string | null => localStorage.getItem("token");

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
  donor?: { name: string };
}

async function fetchPublic<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchAuthed<T>(endpoint: string): Promise<T | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useMapData() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allMarkers: MapMarker[] = [];

      // ── 1. DONATIONS via the new public endpoint ──────────────────────────
      try {
        const donationRes = await fetchPublic<{
          success: boolean;
          data: { locations: any[] };
        }>("/donations/locations");

        if (donationRes.success) {
          for (const d of donationRes.data.locations ?? []) {
            const lat = Number(d.latitude);
            const lng = Number(d.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              allMarkers.push({
                id: String(d.id || d._id),
                type: "donation",
                title: d.foodType || "Food Donation",
                latitude: lat,
                longitude: lng,
                status: d.status,
                quantity: d.quantity,
                quantityUnit: d.quantityUnit,
                expiryDate: d.expiryDate,
                foodType: d.foodType,
                description: d.description,
                donor: d.donor,
              });
            }
          }
          console.log(`📦 Loaded ${allMarkers.length} donations`);
        }
      } catch (e) {
        console.warn("⚠️ Could not load donations:", e);
      }

      // ── 2. NGOs & Volunteers via authed endpoints (graceful if not logged in) ──
      const userRes = await fetchAuthed<{
        success: boolean;
        data: { users: any[] };
      }>("/users?role=NGO");

      if (userRes?.success) {
        for (const n of userRes.data?.users ?? []) {
          const lat = Number(
            n.location?.lat ?? n.location?.latitude ?? n.latitude
          );
          const lng = Number(
            n.location?.lng ?? n.location?.longitude ?? n.longitude
          );
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            allMarkers.push({
              id: String(n._id || n.id),
              type: "ngo",
              title: n.name || "NGO",
              latitude: lat,
              longitude: lng,
              organizationName: n.name,
              description: n.description,
            });
          }
        }
        console.log(
          `🏢 Loaded ${allMarkers.filter((m) => m.type === "ngo").length} NGOs`
        );
      }

      const volRes = await fetchAuthed<{
        success: boolean;
        data: { users: any[] };
      }>("/users?role=VOLUNTEER");

      if (volRes?.success) {
        for (const v of volRes.data?.users ?? []) {
          const lat = Number(
            v.location?.lat ?? v.location?.latitude ?? v.latitude
          );
          const lng = Number(
            v.location?.lng ?? v.location?.longitude ?? v.longitude
          );
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            allMarkers.push({
              id: String(v._id || v.id),
              type: "volunteer",
              title: v.name || "Volunteer",
              latitude: lat,
              longitude: lng,
              description: v.description,
            });
          }
        }
        console.log(
          `🚴 Loaded ${allMarkers.filter((m) => m.type === "volunteer").length} volunteers`
        );
      }

      console.log(`✅ Total markers: ${allMarkers.length}`);
      setMarkers(allMarkers);

      if (allMarkers.length === 0) {
        setError("No locations found. Add donations to see them on the map.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load map data";
      console.error("❌ Map data error:", err);
      setError(msg);
      setMarkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { markers, isLoading, error, refetch: fetchData };
}