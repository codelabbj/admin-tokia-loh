import React, { useRef } from 'react';
import { Camera, ShieldCheck, Calendar } from 'lucide-react';

const ProfileHeader = ({ profile, onAvatarChange }) => {
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        onAvatarChange?.({ file, preview });
    };

    const initials = `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-md overflow-hidden
        ">
            {/* Bandeau dégradé */}
            <div className="h-24 w-full" style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)'
            }} />

            {/* Contenu sous le bandeau */}
            <div className="px-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="
                            w-20 h-20 rounded-full border-4 border-neutral-0 dark:border-neutral-0
                            bg-primary-1 flex items-center justify-center overflow-hidden
                            shadow-md
                        ">
                            {profile.avatar ? (
                                <img src={profile.avatar.preview ?? profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold font-poppins text-white">{initials}</span>
                            )}
                        </div>

                        {/* Bouton changer photo */}
                        <button
                            onClick={() => fileRef.current?.click()}
                            title="Changer la photo"
                            className="
                                absolute bottom-0 right-0 w-7 h-7
                                bg-primary-1 hover:bg-primary-6 text-white
                                rounded-full flex items-center justify-center
                                border-2 border-neutral-0 dark:border-neutral-0
                                transition-colors cursor-pointer shadow-sm
                            "
                        >
                            <Camera size={13} />
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </div>

                    {/* Infos identité */}
                    <div className="flex-1 pb-1 sm:pb-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                {profile.firstName} {profile.lastName}
                            </h2>
                            {/* Badge rôle */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-5 text-primary-1 text-[11px] font-semibold font-poppins">
                                <ShieldCheck size={11} />
                                Administrateur
                            </span>
                        </div>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">{profile.email}</p>

                        {/* Date d'inscription */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <Calendar size={12} className="text-neutral-5" />
                            <span className="text-[11px] font-poppins text-neutral-5">
                                Administrateur depuis le {profile.registeredAt}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;