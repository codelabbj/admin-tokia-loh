import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../Button';
import PhoneInputField from '../PhoneInputField';
import InputField from '../InputField';
import { auth } from '../../config/firebase.config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const SettingsAdminsManager = () => {
    const [admins, setAdmins] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [step, setStep] = useState(1); // 1 = formulaire, 2 = validation OTP
    const [newAdmin, setNewAdmin] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [otpCode, setOtpCode] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [isValidPhone, setIsValidPhone] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Initialiser reCAPTCHA au montage
    /* useEffect(() => {
        if (!window.recaptchaVerifierAdmin) {
            window.recaptchaVerifierAdmin = new RecaptchaVerifier(auth, 'recaptcha-container-admin', {
                'size': 'invisible',
                'callback': () => {
                    console.log('reCAPTCHA résolu');
                }
            });
        }

        return () => {
            if (window.recaptchaVerifierAdmin) {
                window.recaptchaVerifierAdmin.clear();
                window.recaptchaVerifierAdmin = null;
            }
        };
    }, []); */


    // Charger les admins au montage
    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admins');
            const data = await response.json();
            setAdmins(data);
        } catch (err) {
            setError('Erreur lors du chargement des administrateurs');
        } finally {
            setLoading(false);
        }
    };

    // Validation du téléphone
    const handlePhoneChange = (value, country) => {
        const fullNumber = '+' + value;
        setNewAdmin({ ...newAdmin, phone: fullNumber });

        const phoneLength = value.length - country.dialCode.length;
        const expectedLengths = {
            'ci': 10,
            'bj': 10,
            'sn': 9,
            'tg': 8,
            'bf': 8
        };

        const expectedLength = expectedLengths[country.countryCode] || 8;
        const valid = phoneLength === expectedLength;

        setIsValidPhone(valid);
    };

    // Validation du code OTP
    const validateOTP = (code) => /^\d{6}$/.test(code);

    const handleOTPChange = (e) => {
        const { value } = e.target;
        if (value.length <= 6 && /^\d*$/.test(value)) {
            setOtpCode(value);
        }
    };

    // Étape 1 : Soumettre le formulaire et envoyer OTP
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.phone) {
            setError('Tous les champs sont requis');
            return;
        }

        if (!isValidPhone) {
            setError('Numéro de téléphone invalide');
            return;
        }

        setSubmitting(true);

        // TEMPORAIRE : Simulation sans Firebase
        setTimeout(() => {
            setVerificationId('fake-verification-id');
            setStep(2); // Passer à la validation OTP
            setSubmitting(false);
        }, 1500);

        /* VERSION AVEC FIREBASE (décommenter quand la facturation est activée)
        try {
            // Envoyer l'OTP
            const appVerifier = window.recaptchaVerifierAdmin;
            const confirmationResult = await signInWithPhoneNumber(auth, newAdmin.phone, appVerifier);
            
            setVerificationId(confirmationResult.verificationId);
            setStep(2); // Passer à la validation OTP
            setSubmitting(false);
        } catch (err) {
            console.error('Erreur lors de l\'envoi du code:', err);
            let errorMessage = 'Erreur lors de l\'envoi du code';
            
            if (err.code === 'auth/invalid-phone-number') {
                errorMessage = 'Numéro de téléphone invalide';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Trop de tentatives. Réessayez plus tard';
            }
            
            setError(errorMessage);
            setSubmitting(false);
        }
        */
    };

    // Étape 2 : Vérifier OTP et créer l'admin
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (!otpCode || !validateOTP(otpCode)) {
            setError('Le code doit contenir 6 chiffres');
            return;
        }

        setSubmitting(true);

        // TEMPORAIRE : Simulation sans Firebase
        setTimeout(async () => {
            try {
                // Créer l'admin dans votre backend
                const response = await fetch('/api/admins', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newAdmin)
                });

                if (!response.ok) throw new Error('Erreur lors de la création');

                const createdAdmin = await response.json();
                setAdmins([...admins, createdAdmin]);

                // Réinitialiser
                setNewAdmin({ firstName: '', lastName: '', phone: '' });
                setOtpCode('');
                setStep(1);
                setIsAdding(false);
                setSubmitting(false);
            } catch (err) {
                setError(err.message);
                setSubmitting(false);
            }
        }, 1000);

        /* VERSION AVEC FIREBASE (décommenter quand la facturation est activée)
        try {
            // Vérifier le code OTP
            const credential = auth.PhoneAuthProvider.credential(verificationId, otpCode);
            await auth.signInWithCredential(credential);

            // Si validé, créer l'admin dans votre backend
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdmin)
            });

            if (!response.ok) throw new Error('Erreur lors de la création');

            const createdAdmin = await response.json();
            setAdmins([...admins, createdAdmin]);
            
            // Réinitialiser
            setNewAdmin({ firstName: '', lastName: '', phone: '' });
            setOtpCode('');
            setStep(1);
            setIsAdding(false);
            setSubmitting(false);
        } catch (err) {
            console.error('Erreur lors de la vérification:', err);
            let errorMessage = 'Code invalide';
            
            if (err.code === 'auth/invalid-verification-code') {
                errorMessage = 'Code incorrect. Veuillez réessayer';
            } else if (err.code === 'auth/code-expired') {
                errorMessage = 'Le code a expiré. Demandez un nouveau code';
            }
            
            setError(errorMessage);
            setSubmitting(false);
        }
        */
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) return;

        try {
            const response = await fetch(`/api/admins/${adminId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');

            setAdmins(admins.filter(a => a.id !== adminId));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setStep(1);
        setNewAdmin({ firstName: '', lastName: '', phone: '' });
        setOtpCode('');
        setError('');
    };

    const handleBackToForm = () => {
        setStep(1);
        setOtpCode('');
        setError('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-neutral-6 text-sm font-poppins">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Conteneur invisible pour reCAPTCHA */}
            <div id="recaptcha-container-admin"></div>

            {/* Message d'erreur */}
            {error && (
                <div className="bg-danger-2 border border-danger-1 rounded-2 p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-danger-1 shrink-0 mt-0.5" />
                    <p className="text-xs font-poppins text-danger-1">{error}</p>
                </div>
            )}

            {/* Bouton ajouter */}
            {!isAdding && (
                <Button
                    type="button"
                    variant="primary"
                    size="normal"
                    className="mt-2 w-80"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus size={14} />
                    Ajouter un administrateur
                </Button>
            )}

            {/* Formulaire d'ajout */}
            {isAdding && (
                <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5">

                    {/* ÉTAPE 1 : Formulaire */}
                    {step === 1 && (
                        <>
                            <h3 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8 mb-4">
                                Nouvel administrateur
                            </h3>

                            <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
                                {/* Nom */}
                                <InputField
                                    label="Nom"
                                    name="lastName"
                                    type="text"
                                    value={newAdmin.lastName}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                                    placeholder="Ex: Dupont"
                                    required
                                />

                                {/* Prénoms */}
                                <InputField
                                    label="Prénoms"
                                    name="firstName"
                                    type="text"
                                    value={newAdmin.firstName}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                                    placeholder="Ex: Jean Marie"
                                    required
                                />

                                {/* Téléphone */}
                                <PhoneInputField
                                    label="Numéro de téléphone"
                                    name="phone"
                                    value={newAdmin.phone}
                                    onChange={handlePhoneChange}
                                    placeholder="Entrez le numéro"
                                    required
                                />

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="normal"
                                        loading={submitting}
                                        disabled={!isValidPhone || submitting}
                                        className="px-4"
                                    >
                                        {submitting ? 'Envoi du code...' : 'Continuer'}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="normal"
                                        onClick={handleCancel}
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* ÉTAPE 2 : Validation OTP */}
                    {step === 2 && (
                        <>
                            <h3 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8 mb-2">
                                Validation du numéro
                            </h3>
                            <p className="text-xs text-neutral-6 font-poppins mb-4">
                                Un code a été envoyé au {newAdmin.phone.slice(0, 4)}****{newAdmin.phone.slice(-2)}
                            </p>

                            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                                {/* Code OTP */}
                                <InputField
                                    label="Code de vérification"
                                    name="otp"
                                    type="text"
                                    value={otpCode}
                                    onChange={handleOTPChange}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="normal"
                                        loading={submitting}
                                        className="px-4"
                                    >
                                        {submitting ? 'Vérification...' : 'Valider et créer'}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="normal"
                                        onClick={handleBackToForm}
                                    >
                                        <ArrowLeft size={14} />
                                        Retour
                                    </Button>
                                </div>

                                {/* Renvoyer le code */}
                                <button
                                    type="button"
                                    onClick={handleSubmitForm}
                                    disabled={submitting}
                                    className="text-primary-1 hover:text-primary-2 text-xs font-poppins underline disabled:opacity-50"
                                >
                                    Renvoyer le code
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Liste des admins */}
            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                {admins.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield size={32} className="mx-auto mb-3 text-neutral-5" />
                        <p className="text-sm font-poppins text-neutral-6">
                            Aucun administrateur
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-4 dark:divide-neutral-4">
                        {admins.map(admin => (
                            <div
                                key={admin.id}
                                className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary-5 flex items-center justify-center shrink-0">
                                        <Shield size={16} className="text-primary-1" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            {admin.firstName} {admin.lastName}
                                        </p>
                                        <p className="text-[11px] font-poppins text-neutral-6 dark:text-neutral-6">
                                            {admin.phone}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="p-2 rounded-2 text-danger-1 hover:bg-danger-2 transition-all duration-200 cursor-pointer"
                                    title="Supprimer"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsAdminsManager;