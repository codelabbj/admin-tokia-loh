import React from 'react';

/**
 * Affiché par React.Suspense pendant le chargement différé (lazy) d'une page.
 */
const PageLoader = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-0 dark:bg-neutral-1 z-50">
        <div className="flex flex-col items-center gap-4">
            {/* Spinner animé */}
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-3 dark:border-neutral-4" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-1 animate-spin" />
            </div>
            <p className="text-xs font-poppins font-medium text-neutral-5 dark:text-neutral-6 tracking-wide">
                Chargement…
            </p>
        </div>
    </div>
);

export default PageLoader;
