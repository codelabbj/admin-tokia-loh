import React from 'react';
import { Megaphone, Users, Wallet, TrendingUp } from 'lucide-react';
import StatCard from '../dashboard/StatCard';

const AdStatsPanel = ({ campaigns = [] }) => {
    const actives = campaigns.filter(c => c.status === 'ongoing').length;
    const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
    const totalPeople = campaigns.reduce((acc, c) => acc + (Number(c.people) || 0), 0);

    // Nombre de canaux uniques utilisés toutes campagnes confondues
    const allChannels = campaigns.flatMap(c => c.social_media ?? []);
    const uniqueChannels = new Set(allChannels).size;

    return (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
                title="Publicités actives"
                value={String(actives)}
                icon={<Megaphone size={18} />}
                color="primary"
                trend={actives > 0 ? 'up' : 'neutral'}
                trendLabel={`sur ${campaigns.length} total`}
            />
            <StatCard
                title="Personnes ciblées"
                value={totalPeople > 0
                    ? totalPeople >= 1000
                        ? `${(totalPeople / 1000).toFixed(1)}k`
                        : String(totalPeople)
                    : '—'}
                icon={<Users size={18} />}
                color="secondary"
                trendLabel="toutes campagnes"
            />
            <StatCard
                title="Budget total engagé"
                value={totalBudget > 0
                    ? `${totalBudget.toLocaleString('fr-FR')} F`
                    : '—'}
                icon={<Wallet size={18} />}
                color="warning"
            />
            <StatCard
                title="Canaux utilisés"
                value={String(uniqueChannels)}
                icon={<TrendingUp size={18} />}
                color="success"
                trendLabel="canaux distincts"
            />
        </div>
    );
};

export default AdStatsPanel;