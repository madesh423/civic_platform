import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Report, Category } from '@/lib/types';
import { STATUS_META } from '@/lib/constants';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status: Report['status'];
  category?: Category | null;
}

interface OorfixMapProps {
  center?: [number, number];
  zoom?: number;
  pins?: MapPin[];
  height?: string;
  interactive?: boolean;
  onPinClick?: (id: string) => void;
  marker?: { lat: number; lng: number } | null;
  onMarkerDrag?: (lat: number, lng: number) => void;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function DraggableMarker({
  position,
  onDrag,
}: {
  position: [number, number];
  onDrag: (lat: number, lng: number) => void;
}) {
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const m = e.target as L.Marker;
          const ll = m.getLatLng();
          onDrag(ll.lat, ll.lng);
        },
      }}
    >
      <Popup>Drag to adjust location</Popup>
    </Marker>
  );
}

export function OorfixMap({
  center = [13.0827, 80.2707],
  zoom = 12,
  pins = [],
  height = '400px',
  interactive = true,
  onPinClick,
  marker = null,
  onMarkerDrag,
}: OorfixMapProps) {
  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        {pins.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            eventHandlers={{
              click: () => onPinClick?.(p.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.title}</div>
                <div style={{ color: STATUS_META[p.status].color }}>
                  {STATUS_META[p.status].label}
                </div>
                {p.category && <div className="text-slate-500">{p.category.name}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
        {marker && onMarkerDrag && (
          <DraggableMarker position={[marker.lat, marker.lng]} onDrag={onMarkerDrag} />
        )}
      </MapContainer>
    </div>
  );
}
