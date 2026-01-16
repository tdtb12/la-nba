import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon not showing up
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function EventMap({ mapLink }) {
    const [coords, setCoords] = useState(null);

    useEffect(() => {
        if (!mapLink) return;

        // Try to extra coordinates from Google Maps URL
        // Patterns:
        // 1. @lat,lng
        // 2. q=lat,lng (sometimes used via search)
        // 3. !3dlat!4dlng (rare but exists in embed data, less likely in simple links)

        try {
            const atMatch = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) {
                setCoords([parseFloat(atMatch[1]), parseFloat(atMatch[2])]);
                return;
            }

            // Fallback for query params if needed, though most GMaps links use @
            const queryMatch = mapLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (queryMatch) {
                setCoords([parseFloat(queryMatch[1]), parseFloat(queryMatch[2])]);
                return;
            }

        } catch (e) {
            console.error("Failed to parse map coords", e);
        }
    }, [mapLink]);

    if (!coords) return (
        <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
            Map not available
        </div>
    );

    return (
        <div className="h-48 w-full relative z-0">
            <MapContainer
                center={coords}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
                attributionControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coords}>
                    <Popup>
                        <a href={mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
