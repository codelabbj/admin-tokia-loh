import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useOrders, ORDERS_LIST_PAGE_SIZE } from '../hooks/useOrders';
import StatCard from '../components/dashboard/StatCard';
import OrdersTable from '../components/orders/OrdersTable';
import { findOrderListPage } from '../utils/findListPage';

const OrdersPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const highlightOrder = searchParams.get('highlightOrder')?.trim() ?? '';
    const resolvingRef = useRef(false);
    const [tableFlashId, setTableFlashId] = useState('');

    const {
        orders,
        loading,
        updateStatus,
        page,
        setPage,
        totalPages,
        totalCount,
        pageSize,
    } = useOrders();

    const pageStats = useMemo(() => {
        const list = orders ?? [];
        return {
            total: list.length,
            in_progress: list.filter((o) => o.status === 'in_progress').length,
            delivered: list.filter((o) => o.status === 'delivered').length,
            canceled: list.filter((o) => o.status === 'canceled').length,
        };
    }, [orders]);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Commandes';
    }, []);

    useEffect(() => {
        if (!highlightOrder || loading) return;

        const onPage = orders.some((o) => String(o.id) === highlightOrder);
        if (onPage) {
            setTableFlashId(highlightOrder);
            const t = window.setTimeout(() => {
                document.getElementById(`order-row-${highlightOrder}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                setSearchParams((p) => {
                    p.delete('highlightOrder');
                    return p;
                }, { replace: true });
                window.setTimeout(() => setTableFlashId(''), 2200);
            }, 80);
            return () => clearTimeout(t);
        }

        if (resolvingRef.current) return;
        resolvingRef.current = true;
        (async () => {
            try {
                const targetPage = await findOrderListPage(
                    highlightOrder,
                    pageSize ?? ORDERS_LIST_PAGE_SIZE,
                );
                if (targetPage != null) setPage(targetPage);
                else {
                    setSearchParams((p) => {
                        p.delete('highlightOrder');
                        return p;
                    }, { replace: true });
                }
            } finally {
                resolvingRef.current = false;
            }
        })();
    }, [highlightOrder, loading, orders, setPage, setSearchParams, pageSize]);

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

            {/* ── Stats — compteurs sur la page courante (liste paginée) ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total commandes"
                    value={loading ? '…' : String(pageStats.total)}
                    caption="Sur cette page"
                    icon={<ShoppingCart size={18} />}
                    color="primary"
                />
                <StatCard
                    title="En cours"
                    value={loading ? '…' : String(pageStats.in_progress)}
                    caption="Sur cette page"
                    icon={<Clock size={18} />}
                    color="warning"
                />
                <StatCard
                    title="Livrées"
                    value={loading ? '…' : String(pageStats.delivered)}
                    caption="Sur cette page"
                    icon={<CheckCircle size={18} />}
                    color="success"
                />
                <StatCard
                    title="Annulées"
                    value={loading ? '…' : String(pageStats.canceled)}
                    caption="Sur cette page"
                    icon={<XCircle size={18} />}
                    color="danger"
                />
            </div>

            {/* ── Tableau ── */}
            <OrdersTable
                orders={orders}
                loading={loading}
                onStatusChange={updateStatus}
                highlightRowId={highlightOrder || tableFlashId}
                pagination={{
                    page,
                    totalPages,
                    totalCount,
                    pageSize,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
};

export default OrdersPage;