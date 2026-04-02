import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/Button';
import AdStatsPanel from '../components/publish/AdStatsPanel';
import AdCampaignList from '../components/publish/AdCampaignList';
import AdCampaignForm from '../components/publish/AdCampaignForm';
import { usePubs } from '../hooks/usePubs';
import { useToast } from '../components/ui/ToastProvider';

const PublishPage = () => {
    const { pubs: campaigns, loading, error, create, update, remove } = usePubs();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Publicité';
    }, []);

    const handleCreate = () => {
        setSelectedCampaign(null);
        setModalOpen(true);
    };

    const handleEdit = (campaign) => {
        setSelectedCampaign(campaign);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedCampaign(null);
    };

    // Le formulaire renvoie déjà la structure API exacte
    const handleSave = async (payload) => {


        try {
            if (selectedCampaign) {
                await update(selectedCampaign.id, payload);
                toast.success("Publicité mise à jour avec succès");
            } else {
                await create(payload);
                toast.success("Publicité ajoutée avec succès");
            }
        } catch (err) {
            console.log(err);
            const errorMsg = err.response?.data?.status?.[0] || err.response?.data?.detail;

            if (errorMsg?.includes('already exists') || errorMsg?.includes('existe déjà')) {
                toast.error(`La publicité "${payload.title}" existe déjà !`);
            }
            else if (errorMsg?.includes('is not a valid choice') || errorMsg?.includes("draft")) {
                toast.error(`La publicité "${payload.title}" ne doit pas être en brouillon à l'enregistrement !`);
            }
            else {
                toast.error("Une erreur est survenue lors de l'enregistrement.");
            }
        }

    };

    const handleDelete = async (campaign) => {
        if (!window.confirm(`Supprimer la publicité "${campaign.title}" ?`)) return;
        await remove(campaign.id);
    };

    const handleDuplicate = async (campaign) => {
        try {
            const endRaw = campaign.end_date;
            const end_date = endRaw ? String(endRaw).slice(0, 10) : null;
            const budget =
                campaign.budget != null && campaign.budget !== ''
                    ? String(Number(campaign.budget))
                    : '0.00';

            await create({
                title: `${campaign.title ?? 'Sans titre'} (copie)`,
                content: campaign.content ?? '',
                image: campaign.image ?? null,
                budget,
                end_date,
                social_media: Array.isArray(campaign.social_media)
                    ? [...campaign.social_media]
                    : [],
                people: Number(campaign.people) || 0,
                // Le POST /shop/pubs/ n’accepte pas le statut "draft" côté API
                status: 'paused',
            });
            toast.success(
                'Publicité dupliquée (en pause). Réactivez-la ou modifiez-la avant diffusion.',
            );
        } catch (err) {
            const detail =
                err?.response?.data?.detail ??
                err?.response?.data?.message ??
                err?.message;
            toast.error(
                typeof detail === 'string'
                    ? detail
                    : 'Impossible de dupliquer la publicité.',
            );
        }
    };

    // Toggle ongoing ↔ paused via PATCH
    const handleTogglePause = async (campaign) => {
        const newStatus = campaign.status === 'ongoing' ? 'paused' : 'ongoing';
        await update(campaign.id, { status: newStatus });
    };

    return (
        <div className="flex flex-col gap-6">

            {/* En-tête */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Publicité
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Créez et gérez vos publicités
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="normal"
                    icon={<Plus size={15} />}
                    iconPosition="left"
                    onClick={handleCreate}
                >
                    <span className="hidden sm:inline">Nouvelle publicité</span>
                </Button>
            </div>

            {/* Erreur réseau */}
            {error && (
                <div className="rounded-2 bg-danger-2 border border-danger-1 px-4 py-3">
                    <p className="text-xs font-poppins text-danger-1">
                        Erreur lors du chargement : {error}
                    </p>
                </div>
            )}

            {/* Stats */}
            <AdStatsPanel campaigns={campaigns} />

            {/* Liste */}
            <AdCampaignList
                campaigns={campaigns}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onTogglePause={handleTogglePause}
            />

            {/* Modal */}
            <AdCampaignForm
                open={modalOpen}
                onClose={handleClose}
                campaign={selectedCampaign}
                onSave={handleSave}
            />
        </div>
    );
};

export default PublishPage;