import React, { useState, useEffect } from 'react';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileInfoForm from '../components/profile/ProfileInfoForm';
import ProfilePasswordForm from '../components/profile/ProfilePasswordForm';

// Données mock admin connecté — à remplacer par le contexte Auth
const MOCK_ADMIN = {
    firstName: 'Admin',
    lastName: 'Tokia',
    email: 'admin@tokia-loh.com',
    phone: '+225 07 00 11 22',
    city: 'Abidjan',
    registeredAt: '12/01/2025',
    avatar: null,
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(MOCK_ADMIN);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Mon profil';
    }, []);

    const handleAvatarChange = (avatar) => {
        setProfile(prev => ({ ...prev, avatar }));
        // TODO : appel API upload avatar
    };

    const handleInfoSave = (updatedInfo) => {
        setProfile(prev => ({ ...prev, ...updatedInfo }));
        // TODO : appel API PATCH /admin/profile
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête page ── */}
            <div>
                <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                    Mon profil
                </h1>
                <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                    Gérez vos informations personnelles et votre sécurité
                </p>
            </div>

            {/* ── ProfileHeader + ProfileInfoForm ──
                Mobile  : empilés (flex-col)
                Desktop : côte à côte (md:flex-row)
                ProfileHeader prend 2/5, ProfileInfoForm prend le reste
            ── */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-2/5 shrink-0">
                    <ProfileHeader
                        profile={profile}
                        onAvatarChange={handleAvatarChange}
                    />
                </div>
                <div className="w-full md:flex-1 min-w-0">
                    <ProfileInfoForm
                        profile={profile}
                        onSave={handleInfoSave}
                    />
                </div>
            </div>

            {/* ── Mot de passe — pleine largeur ── 
            <ProfilePasswordForm />*/}
        </div>
    );
};

export default ProfilePage;