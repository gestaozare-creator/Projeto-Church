"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Create custom icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

const icons = {
  membro: createIcon('#2ecc71'), // Green
  visitante: createIcon('#f1c40f'), // Yellow
  church: createIcon('#3498db'), // Blue
};

// Component to recenter map when church changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LeafletMap({
  people,
  church,
  selectedPerson,
  geocache
}: {
  people: any[];
  church: any;
  selectedPerson: any;
  geocache: Record<string, { lat: number, lng: number } | null>;
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const churchPos: [number, number] = geocache[church?.address || ''] ? [geocache[church.address]!.lat, geocache[church.address]!.lng] : [-25.4284, -49.2733]; // Default to Curitiba

  const markers = useMemo(() => {
    return people.map(p => {
      const addr = p.address ? p.address.trim() : '';
      const geo = geocache[addr];
      if (!geo) return null;
      
      // Add a tiny random jitter (approx 50-150 meters) if they share the same neighborhood center
      // 0.0001 deg is approx 11 meters.
      const jitterLat = (Math.random() - 0.5) * 0.003;
      const jitterLng = (Math.random() - 0.5) * 0.003;
      
      return {
        ...p,
        lat: geo.lat + jitterLat,
        lng: geo.lng + jitterLng
      };
    }).filter(p => p !== null);
  }, [people, geocache]);

  if (!mounted) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando mapa interativo...</div>;

  const centerPos = selectedPerson && selectedPerson.address && geocache[selectedPerson.address.trim()] 
    ? [geocache[selectedPerson.address.trim()]!.lat, geocache[selectedPerson.address.trim()]!.lng] as [number, number]
    : churchPos;

  return (
    <MapContainer center={centerPos} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 1 }}>
      <MapRecenter center={centerPos} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <Marker position={churchPos} icon={icons.church}>
        <Popup>
          <strong>{church?.name || 'Igreja'}</strong><br/>
          {church?.address}
        </Popup>
      </Marker>

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={40}
      >
        {markers.map((m: any) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={icons[m.type as 'membro'|'visitante'] || icons.membro}>
            <Popup>
              <strong>{m.name}</strong> ({m.type})<br/>
              {m.address}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
