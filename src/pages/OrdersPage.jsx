import React, { useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import StatCard from '../components/dashboard/StatCard';
import OrdersTable from '../components/orders/OrdersTable';

const OrdersPage = () => {
    const { orders, stats, loading, updateStatus } = useOrders();

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Commandes';
    }, []);

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div>
                <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                    Commandes
                </h1>
                <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                    Gérez et suivez toutes les commandes
                </p>
            </div>

            {/* ── Stats — issues directement de /dashboard-orders/ ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total commandes"
                    value={loading ? '…' : String(stats?.total ?? 0)}
                    icon={<ShoppingCart size={18} />}
                    color="primary"
                />
                <StatCard
                    title="En cours"
                    value={loading ? '…' : String(stats?.in_progress ?? 0)}
                    icon={<Clock size={18} />}
                    color="warning"
                />
                <StatCard
                    title="Livrées"
                    value={loading ? '…' : String(stats?.delivered ?? 0)}
                    icon={<CheckCircle size={18} />}
                    color="success"
                />
                <StatCard
                    title="Annulées"
                    value={loading ? '…' : String(stats?.canceled ?? 0)}
                    icon={<XCircle size={18} />}
                    color="danger"
                />
            </div>

            {/* ── Tableau ── */}
            <OrdersTable
                orders={orders}
                loading={loading}
                onStatusChange={updateStatus}
            />
        </div>
    );
};

export default OrdersPage;