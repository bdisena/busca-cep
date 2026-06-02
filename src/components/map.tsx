"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  lat: number;
  lon: number;
  popupTitle?: string;
  popupAddress?: string;
}

export default function Map({ lat, lon, popupTitle, popupAddress }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon paths
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.flyTo([lat, lon], 15, { duration: 1.2 });

    const popupHtml = `
      <div style="font-family: sans-serif; font-size: 13px;">
        <strong style="color: #C51F33; font-size: 14px;">📍 ${popupTitle || "Endereço"}</strong>
        <p style="margin: 4px 0 0 0; color: #555;">${popupAddress || ""}</p>
      </div>
    `;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]).setPopupContent(popupHtml);
    } else {
      markerRef.current = L.marker([lat, lon]).addTo(mapRef.current).bindPopup(popupHtml);
    }

    markerRef.current.openPopup();
  }, [lat, lon, popupTitle, popupAddress]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[350px] rounded-2xl shadow-inner border border-zinc-200" />;
}
