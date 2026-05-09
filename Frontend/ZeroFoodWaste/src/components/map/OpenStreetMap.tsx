import { useEffect, useRef, useId } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "@/hooks/useMapData";

interface OpenStreetMapProps {
  markers: MapMarker[];
  userLocation: { lat: number; lng: number } | null;
  onMarkerClick: (marker: MapMarker) => void;
  selectedMarkerId?: string;
  nearestNGOLine?: { donation: MapMarker; ngo: MapMarker } | null;
}

const MARKER_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  donation: { color: "#10b981", label: "D" },
  ngo: { color: "#3b82f6", label: "N" },
  volunteer: { color: "#f59e0b", label: "V" },
};

/** Build an SVG data-URL showing a letter label (fallback) */
function svgDataUrl(color: string, label: string, selected: boolean): string {
  const ring = selected
    ? `<circle cx="22" cy="22" r="22" fill="${color}" opacity="0.3"/>`
    : "";
  const svg =
    `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">` +
    ring +
    `<circle cx="22" cy="22" r="18" fill="${color}"/>` +
    `<circle cx="22" cy="22" r="12" fill="white"/>` +
    `<text x="22" y="28" font-size="13" font-weight="bold" text-anchor="middle"` +
    ` dominant-baseline="middle" fill="${color}" font-family="Arial,sans-serif">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Build a Leaflet DivIcon — uses profile image if provided, otherwise letter fallback */
function makeIcon(
  color: string,
  label: string,
  selected: boolean,
  profileImage?: string
): L.DivIcon {
  const size = 48;
  const half = size / 2;
  const ring = selected
    ? `box-shadow:0 0 0 4px ${color}55, 0 2px 12px rgba(0,0,0,0.25);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.22);`;

  let inner: string;
  if (profileImage) {
    inner =
      `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;` +
      `border:3px solid ${color};${ring}background:#fff;">` +
      `<img src="${profileImage}" width="${size}" height="${size}" ` +
      `style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" ` +
      `onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${color};color:#fff;font-weight:bold;font-size:18px;font-family:Arial,sans-serif;\'>${label}</div>'"/>`+
      `</div>`;
  } else {
    inner =
      `<div style="width:${size}px;height:${size}px;border-radius:50%;display:flex;` +
      `align-items:center;justify-content:center;background:${color};` +
      `border:3px solid white;${ring}color:#fff;font-weight:bold;font-size:20px;` +
      `font-family:Arial,sans-serif;">${label}</div>`;
  }

  return new L.DivIcon({
    html: inner,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 4],
  });
}

function makeUserIcon(): L.DivIcon {
  const svg =
    `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.35"/>` +
    `<circle cx="20" cy="20" r="13" fill="#3b82f6" stroke="white" stroke-width="3"/>` +
    `<circle cx="20" cy="20" r="6" fill="white"/>` +
    `</svg>`;
  return new L.DivIcon({
    html: `<img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="40" height="40" alt="You"/>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function OpenStreetMapComponent({
  markers,
  userLocation,
  onMarkerClick,
  selectedMarkerId,
  nearestNGOLine,
}: OpenStreetMapProps) {
  // Stable container id – survives React Strict Mode double-mount
  const uid = useId().replace(/:/g, "");
  const mapRef = useRef<L.Map | null>(null);
  const dataMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // ── Init map (only once per mount) ───────────────────────────────────────
  useEffect(() => {
    const containerId = `map-${uid}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    // Guard against React Strict Mode double-invocation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((container as any)._leaflet_id != null) return;

    const map = L.map(container, {
      center: [27.7172, 85.324],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Tell Leaflet to recalculate tile coverage after first paint
    setTimeout(() => map.invalidateSize(), 100);

    mapRef.current = map;

    return () => {
      // Clean up all layers before removing
      dataMarkersRef.current.forEach((m) => m.remove());
      dataMarkersRef.current.clear();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // ── Pan to user location ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setView([userLocation.lat, userLocation.lng], 13, {
      animate: true,
    });
  }, [userLocation]);

  // ── User location marker ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    if (!userLocation) return;

    userMarkerRef.current = L.marker(
      [userLocation.lat, userLocation.lng],
      { icon: makeUserIcon(), zIndexOffset: 1000 }
    )
      .addTo(map)
      .bindPopup("<b>You are here</b>");
  }, [userLocation]);

  // ── Data markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale markers
    dataMarkersRef.current.forEach((m) => m.remove());
    dataMarkersRef.current.clear();

    markers.forEach((md) => {
      const cfg = MARKER_CONFIG[md.type] ?? MARKER_CONFIG.donation;
      const isSelected = md.id === selectedMarkerId;
      const icon = makeIcon(cfg.color, cfg.label, isSelected, md.profileImage);

      const typeLabel =
        md.type === "donation" ? "Donation" : md.type === "ngo" ? "NGO" : "Volunteer";

      const popup =
        `<div style="min-width:170px;font-family:sans-serif;font-size:13px;">` +
        `<b style="color:${cfg.color}">${typeLabel}</b><br/>` +
        `<strong>${md.title}</strong><br/>` +
        (md.foodType ? `<span>Food: ${md.foodType}</span><br/>` : "") +
        (md.quantity ? `<span>Qty: ${md.quantity} ${md.quantityUnit ?? "units"}</span><br/>` : "") +
        (md.expiryDate
          ? `<span>Expires: ${new Date(md.expiryDate).toLocaleDateString()}</span>`
          : "") +
        `</div>`;

      const marker = L.marker([md.latitude, md.longitude], { icon })
        .addTo(map)
        .bindPopup(popup);

      marker.on("click", () => onMarkerClick(md));
      dataMarkersRef.current.set(md.id, marker);
    });
  }, [markers, selectedMarkerId, onMarkerClick]);

  // ── Donation → NGO polyline ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polylineRef.current?.remove();
    polylineRef.current = null;

    if (!nearestNGOLine) return;

    const { donation, ngo } = nearestNGOLine;
    polylineRef.current = L.polyline(
      [
        [donation.latitude, donation.longitude],
        [ngo.latitude, ngo.longitude],
      ],
      { color: "#6366f1", weight: 3, opacity: 0.85, dashArray: "8 6" }
    )
      .addTo(map)
      .bindPopup("Nearest NGO route");
  }, [nearestNGOLine]);

  return (
    <div
      id={`map-${uid}`}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    />
  );
}
