import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Share2, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet avec Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const OrderMap = ({ client, orderId }) => {
    const { latitude, longitude, firstName, lastName, address, city } = client;

    // state pour savoir si la possition a été copiée
    const [copied, setCopied] = useState(false);

    // Si pas de coordonnées, ne rien afficher
    if (!latitude || !longitude) return null;

    const position = [latitude, longitude];

    const handleShareLocation = () => {
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `📍 Livraison commande #${orderId}\n${firstName} ${lastName}\n${address}, ${city}\n${googleMapsUrl}`;

        // Copier dans le presse-papier
        navigator.clipboard.writeText(message).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Réinitialiser après 2 secondes
        }).catch(() => {
            // Fallback : ouvrir WhatsApp directement
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        });
    };

    const openInMaps = () => {
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                    Localisation du client
                </p>
                <div className='flex gap-2'>
                    {
                        copied && (
                            <p className="text-xs font-semibold px-3 py-1.5 font-poppins text-green-600 uppercase tracking-wide">
                                <CheckCircle size={12} className="inline-block ml-1" /> Position Copiée
                            </p>)
                    }
                    <button
                        onClick={handleShareLocation}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-1 hover:bg-primary-2 text-white rounded-md cursor-pointer text-xs font-poppins font-medium transition-colors"
                    >
                        <Share2 size={12} />
                        Partager au livreur
                    </button>
                </div>

            </div>

            <div className="border border-neutral-4 dark:border-neutral-4 rounded-2 overflow-hidden">
                {/* Carte */}
                <div className="h-64 w-full relative">
                    <MapContainer
                        center={position}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position}>
                            <Popup>
                                <div className="text-xs font-poppins">
                                    <p className="font-semibold">{firstName} {lastName}</p>
                                    <p className="text-neutral-6">{address}</p>
                                    <p className="text-neutral-6">{city}</p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

                {/* Adresse en dessous */}
                <div className="bg-neutral-2 dark:bg-neutral-2 px-4 py-3 flex items-start gap-2">
                    <MapPin size={14} className="text-primary-1 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                            {address}
                        </p>
                        <p className="text-[11px] font-poppins text-neutral-6">
                            {city}
                        </p>
                        <button
                            onClick={openInMaps}
                            className="text-[11px] font-poppins text-primary-1 hover:underline mt-1"
                        >
                            Ouvrir dans Google Maps →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderMap;