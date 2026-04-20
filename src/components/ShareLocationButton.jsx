import React, { useState } from 'react';
import { Share2, Copy, Mail, MessageCircle, Check } from 'lucide-react';

const ShareLocationButton = ({ client, orderId, orderReference }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const { latitude, longitude, firstName, lastName, address, city } = client;
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const displayOrderRef = orderReference ?? orderId;
    const message = `📍 Livraison commande #${displayOrderRef}
${firstName} ${lastName}
${address}, ${city}
${googleMapsUrl}`;

    const handleShare = async () => {
        // Mobile : utiliser Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Livraison commande #${displayOrderRef}`,
                    text: message,
                });
                return;
            } catch (error) {
                if (error.name === 'AbortError') return;
            }
        }

        // Desktop : afficher le menu
        setShowMenu(!showMenu);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setShowMenu(false);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareViaWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        setShowMenu(false);
    };

    const shareViaEmail = () => {
        window.location.href = `mailto:?subject=Livraison commande #${displayOrderRef}&body=${encodeURIComponent(message)}`;
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-1 hover:bg-primary-2 rounded-md cursor-pointer text-white rounded-2 text-xs font-poppins font-medium transition-colors"
            >
                {copied ? (
                    <>
                        <Check size={12} />
                        Localisation Copiée !
                    </>
                ) : (
                    <>
                        <Share2 size={12} />
                        Partager au livreur
                    </>
                )}
            </button>

            {/* Menu dropdown pour desktop */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-1 rounded-2 shadow-lg border border-neutral-4 overflow-hidden z-20 min-w-45">
                        <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-2 text-left text-xs font-poppins text-neutral-8"
                        >
                            <Copy size={14} className="text-primary-1" />
                            Copier le message
                        </button>
                        <button
                            onClick={shareViaWhatsApp}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-2 text-left text-xs font-poppins text-neutral-8"
                        >
                            <MessageCircle size={14} className="text-green-600" />
                            Envoyer via WhatsApp
                        </button>
                        <button
                            onClick={shareViaEmail}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-2 text-left text-xs font-poppins text-neutral-8"
                        >
                            <Mail size={14} className="text-blue-600" />
                            Envoyer par email
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ShareLocationButton;