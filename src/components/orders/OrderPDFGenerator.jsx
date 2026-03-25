import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Helpers ──────────────────────────────────────────────────────
const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// Couleurs design system
const BLUE = [14, 165, 233];   // primary-1
const VIOLET = [139, 92, 246];   // secondary-1
const DARK = [15, 23, 42];     // neutral-10
const GRAY = [100, 116, 139];  // neutral-6
const LIGHT = [241, 245, 249];  // neutral-2

// ── En-tête commune ──────────────────────────────────────────────
const drawHeader = (doc, title, order) => {
    // Fond header
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, 210, 28, 'F');

    // Logo TL
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TL', 14, 18);

    // Nom app
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('Tokia-Loh', 26, 18);

    // Titre document
    doc.setFontSize(10);
    doc.setTextColor(200, 230, 255);
    doc.text(title, 14, 25);

    // N° commande à droite
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(order.id, 196, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text(formatDate(order.date), 196, 22, { align: 'right' });
};

// ── Infos client ─────────────────────────────────────────────────
const drawClientInfo = (doc, order, startY) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('INFORMATIONS CLIENT', 14, startY);

    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(14, startY + 1, 80, startY + 1);

    const infos = [
        ['Nom', `${order.client.firstName} ${order.client.lastName}`],
        ['Téléphone', order.client.phone],
        ['Ville', order.client.city],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    let y = startY + 6;
    infos.forEach(([key, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(`${key} :`, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        doc.text(val ?? '—', 40, y);
        y += 6;
    });

    return y + 4;
};

// ── Note de commande ─────────────────────────────────────────────
const drawNote = (doc, note, startY) => {
    if (!note) return startY;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('NOTE DU CLIENT', 14, startY);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(`"${note}"`, 182);
    doc.text(lines, 14, startY + 5);
    return startY + 5 + lines.length * 5 + 4;
};

// ── Footer ───────────────────────────────────────────────────────
const drawFooter = (doc) => {
    const pageH = doc.internal.pageSize.height;
    doc.setFillColor(...LIGHT);
    doc.rect(0, pageH - 14, 210, 14, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('Tokia-Loh — Paiement à la livraison', 14, pageH - 6);
    doc.text('Merci pour votre confiance !', 196, pageH - 6, { align: 'right' });
};

// ════════════════════════════════════════════════════════════════
// GÉNÉRATION FACTURE
// ════════════════════════════════════════════════════════════════
export const generateInvoice = (order) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    drawHeader(doc, 'FACTURE', order);

    let y = 36;

    y = drawClientInfo(doc, order, y);

    // Tableau des produits
    autoTable(doc, {
        startY: y,
        head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
        body: order.items.map(item => [
            item.name,
            item.quantity,
            formatPrice(item.unitPrice),
            formatPrice(item.quantity * item.unitPrice),
        ]),
        foot: [
            ['', '', 'Sous-total', formatPrice(order.subtotal)],
            ['', '', 'Livraison', formatPrice(order.deliveryFee ?? 0)],
            ['', '', 'TOTAL', formatPrice(order.total)],
        ],
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
        headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
        footStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
    y = drawNote(doc, order.note, y);
    drawFooter(doc);

    doc.save(`Facture_${order.id}.pdf`);
};

// ════════════════════════════════════════════════════════════════
// GÉNÉRATION BON DE LIVRAISON
// ════════════════════════════════════════════════════════════════
export const generateDeliveryNote = (order) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    drawHeader(doc, 'BON DE LIVRAISON', order);

    let y = 36;

    // Infos client + livreur côte à côte
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('DESTINATAIRE', 14, y);

    doc.setDrawColor(...VIOLET);
    doc.setLineWidth(0.5);
    doc.line(14, y + 1, 70, y + 1);

    const clientLines = [
        `${order.client.firstName} ${order.client.lastName}`,
        order.client.phone,
        order.client.city,
    ];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    clientLines.forEach((line, i) => {
        doc.text(line, 14, y + 7 + i * 6);
    });

    // Cadre signature livreur
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('SIGNATURE LIVREUR', 120, y);
    doc.setDrawColor(...VIOLET);
    doc.line(120, y + 1, 196, y + 1);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(120, y + 4, 76, 24);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRAY);
    doc.text('Signature + cachet', 158, y + 18, { align: 'center' });

    y += 34;

    // Tableau articles (simplifié pour livraison)
    autoTable(doc, {
        startY: y,
        head: [['Produit', 'Quantité', 'Remarque']],
        body: order.items.map(item => [
            item.name,
            item.quantity,
            '',
        ]),
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 4, minCellHeight: 10 },
        headStyles: { fillColor: VIOLET, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center', cellWidth: 30 }, 2: { cellWidth: 60 } },
        margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
    y = drawNote(doc, order.note, y);

    // Confirmation réception
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('CONFIRMATION DE RÉCEPTION', 14, y);
    doc.setDrawColor(...BLUE);
    doc.line(14, y + 1, 100, y + 1);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(14, y + 4, 182, 18);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('Nom + Signature du client', 105, y + 16, { align: 'center' });

    drawFooter(doc);

    doc.save(`BonLivraison_${order.id}.pdf`);
};