import React, { useRef, useState, useEffect } from 'react';
import { Film } from 'lucide-react';

/**
 * Miniature vidéo : extrait une image depuis les métadonnées du fichier (première frame).
 */
const VideoFileThumbnail = ({
    src,
    className = '',
    iconSize = 20,
    lazy = true,
    showBadge = true,
}) => {
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const [inView, setInView] = useState(!lazy);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!lazy || inView) return;
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '120px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [lazy, inView]);

    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (!video) return;
        const seekTo = Number.isFinite(video.duration) && video.duration > 0
            ? Math.min(0.5, video.duration * 0.05)
            : 0.1;
        video.currentTime = seekTo;
    };

    if (!src || failed) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-full flex items-center justify-center bg-neutral-3 ${className}`}
            >
                <Film size={iconSize} className="text-neutral-5" />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden bg-neutral-3 ${className}`}
        >
            {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Film size={iconSize} className="text-neutral-5 animate-pulse" />
                </div>
            )}

            {inView && (
                <video
                    ref={videoRef}
                    src={src}
                    muted
                    playsInline
                    preload="metadata"
                    className={`w-full h-full object-cover ${ready ? 'opacity-100' : 'opacity-0'}`}
                    onLoadedMetadata={handleLoadedMetadata}
                    onSeeked={() => setReady(true)}
                    onCanPlay={() => setReady(true)}
                    onError={() => setFailed(true)}
                />
            )}

            {showBadge && ready && (
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-neutral-8/75 flex items-center justify-center pointer-events-none">
                    <Film size={10} className="text-white" />
                </div>
            )}
        </div>
    );
};

export default VideoFileThumbnail;
