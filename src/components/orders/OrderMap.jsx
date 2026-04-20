import React from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';
import ShareLocationButton from '../ShareLocationButton';

const OrderMap = ({ client, orderId, orderReference }) => {
    const { latitude, longitude, address, city } = client;

    if (!latitude || !longitude) return null;

    const openInMaps = () => {
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-2">
                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                    Localisation du client
                </p>
                <div>
                    <ShareLocationButton client={client} orderId={orderId} orderReference={orderReference} />
                </div>
            </div>

            <div className="border border-neutral-4 dark:border-neutral-4 rounded-2 overflow-hidden p-2">
                {/* Carte MapLibre - AUCUN TOKEN REQUIS */}
                <div className="h-64 w-full relative">
                    <Map
                        initialViewState={{
                            longitude: longitude,
                            latitude: latitude,
                            zoom: 5,
                        }}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle="https://tiles.openfreemap.org/styles/liberty"
                    >
                        <Marker
                            longitude={longitude}
                            latitude={latitude}
                            color="red"
                        />
                        <NavigationControl position="top-right" />
                    </Map>
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