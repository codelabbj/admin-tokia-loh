import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';

const INIT = {
    orderConfirmation: `Bonjour {prénom}, votre commande #{numéro} a bien été reçue. Nous la préparons dans les plus brefs délais. Merci de votre confiance !`,
    orderDelivered: `Bonjour {prénom}, votre commande #{numéro} a été livrée avec succès. Nous espérons que vous êtes satisfait(e) de vos achats. À bientôt sur Tokia-Loh !`,
    orderCancelled: `Bonjour {prénom}, votre commande #{numéro} a été annulée. Si vous avez des questions, n'hésitez pas à nous contacter. Cordialement, l'équipe Tokia-Loh.`,
};

const VARIABLES = ['{prénom}', '{numéro}', '{total}', '{ville}'];

const MESSAGE_FIELDS = [
    { key: 'orderConfirmation', label: 'Confirmation de commande', description: 'Envoyé dès qu\'une commande est reçue' },
    { key: 'orderDelivered', label: 'Commande livrée', description: 'Envoyé quand le statut passe à "Livrée"' },
    { key: 'orderCancelled', label: 'Commande annulée', description: 'Envoyé quand le statut passe à "Annulée"' },
];

const SettingsMessagesForm = () => {
    const [form, setForm] = useState(INIT);
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // TODO : appel API PATCH /settings/messages
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Info variables */}
            <div className="flex items-start gap-2 bg-primary-5 dark:bg-primary-5 border border-primary-3 rounded-2 px-4 py-3">
                <MessageSquare size={14} className="text-primary-1 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-semibold font-poppins text-primary-7">Variables disponibles</p>
                    <p className="text-[11px] font-poppins text-primary-7 mt-0.5">
                        Utilisez ces variables dans vos messages, elles seront remplacées automatiquement :
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {VARIABLES.map(v => (
                            <span key={v} className="px-2 py-0.5 rounded-full bg-primary-3 text-neutral-9 text-[11px] font-mono font-semibold">
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-6
            ">
                {MESSAGE_FIELDS.map(field => (
                    <div key={field.key} className="flex flex-col gap-1.5">
                        <div className="mb-1">
                            <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                {field.label}
                            </p>
                            <p className="text-[11px] font-poppins text-neutral-5">{field.description}</p>
                        </div>
                        <InputField
                            name={field.key}
                            type="textarea"
                            value={form[field.key]}
                            onChange={handleChange}
                            placeholder="Rédigez votre message..."
                        />
                    </div>
                ))}
            </div>

            {/* Sauvegarder */}
            <div className="flex items-center justify-end gap-3">
                {saved && <span className="text-xs font-poppins text-success-1 font-medium">✓ Sauvegardé</span>}
                <Button variant="primary" size="normal" onClick={handleSave}>
                    Sauvegarder
                </Button>
            </div>
        </div>
    );
};

export default SettingsMessagesForm;