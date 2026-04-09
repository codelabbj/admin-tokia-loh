import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

const StockBadge = ({ stock }) => {
    if (stock === 0) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-2 text-danger-1 text-[11px] font-semibold font-poppins">
            <AlertTriangle size={10} /> Rupture
        </span>
    );
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning-2 text-warning-1 text-[11px] font-semibold font-poppins">
            {stock} restant{stock > 1 ? 's' : ''}
        </span>
    );
};

const ProductAvatar = ({ name }) => (
    <div className="w-9 h-9 rounded-2 bg-secondary-5 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold font-poppins text-secondary-1 uppercase">
            {name?.slice(0, 2) ?? '??'}
        </span>
    </div>
);

/*
  Props :
  - products : tableau issu de stats.low_stock
    [{ id, name, stock, image }]
*/
const LowStockList = ({ products = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-2 overflow-hidden
        ">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                        Ruptures de stock
                    </h2>
                    {products.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-danger-2 text-danger-1 text-[11px] font-bold font-poppins flex items-center justify-center">
                            {products.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => navigate('/products?filter=low-stock')}
                    className="flex items-center gap-1 text-xs font-poppins text-primary-1 hover:underline cursor-pointer"
                >
                    Voir tout <ArrowRight size={13} />
                </button>
            </div>

            {/* Liste */}
            {products.length === 0 ? (
                <div className="px-5 py-8 text-center text-neutral-5 text-xs font-poppins">
                    Aucune rupture de stock
                </div>
            ) : (
                <div className="divide-y divide-neutral-4 dark:divide-neutral-4">
                    {products.map(product => (
                        <div
                            key={product.id}
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="
                                flex items-center justify-between gap-3 px-5 py-3
                                hover:bg-neutral-2 dark:hover:bg-neutral-2
                                transition-colors duration-150 cursor-pointer
                            "
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {product.image
                                    ? <img src={product.image} alt={product.name} className="w-9 h-9 rounded-2 object-cover shrink-0" loading="lazy" />
                                    : <ProductAvatar name={product.name} />
                                }
                                <span className="text-xs font-medium font-poppins text-neutral-8 dark:text-neutral-8 truncate">
                                    {product.name}
                                </span>
                            </div>
                            <StockBadge stock={product.stock} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LowStockList;