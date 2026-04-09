import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Helpers ──────────────────────────────────────────────────────
const formatReference = (ref) => {
    const r = String(ref ?? "").trim();
    if (!r) return "—";
    return r.startsWith("#") ? r : `#${r}`;
};

const formatMoney = (value) => {
    let n = Number(value);
    if (!Number.isFinite(n)) {
        const s = String(value ?? "")
            .replace(/[\u00A0\u202F\s]/g, "")
            .trim();
        // si "185,00" => "185.00"
        const normalized = s.includes(",") && !s.includes(".") ? s.replace(",", ".") : s;
        n = Number(normalized);
    }

    if (!Number.isFinite(n)) return "—";

    // Format attendu par l'UI/les exemples : 185.000,00 F
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    const fixed = abs.toFixed(2); // "185000.00"
    const [intPart, decPart] = fixed.split(".");
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${sign}${intFormatted},${decPart} F`;
};

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

const monogramFromName = (name) => {
    const s = String(name ?? '').trim();
    if (!s) return 'TL';
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }
    return s.slice(0, 2).toUpperCase();
};

async function fetchLogoAsDataUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) return null;
        return await new Promise((resolve) => {
            const r = new FileReader();
            r.onloadend = () =>
                resolve(typeof r.result === 'string' ? r.result : null);
            r.onerror = () => resolve(null);
            r.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function imageFormatFromDataUrl(dataUrl) {
    if (dataUrl.includes('image/png')) return 'PNG';
    if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
    if (dataUrl.includes('image/webp')) return 'WEBP';
    return 'PNG';
}

// ── En-tête commune ──────────────────────────────────────────────
const drawHeader = (doc, title, order, company, logoDataUrl) => {
    const brandName =
        (company?.name && String(company.name).trim()) || 'Tokia-Loh';

    doc.setFillColor(...BLUE);
    doc.rect(0, 0, 210, 28, 'F');

    let nameX = 14;
    const logoY = 7;
    const logoMm = 14;

    if (logoDataUrl) {
        try {
            const fmt = imageFormatFromDataUrl(logoDataUrl);
            doc.addImage(logoDataUrl, fmt, 14, logoY, logoMm, logoMm);
            nameX = 14 + logoMm + 4;
        } catch {
            logoDataUrl = null;
        }
    }

    if (!logoDataUrl) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(monogramFromName(brandName), 14, 18);
        nameX = 26;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(brandName, nameX, 18);

    doc.setFontSize(10);
    doc.setTextColor(200, 230, 255);
    doc.text(title, 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(formatReference(order.reference), 196, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text(formatDate(order.date), 196, 22, { align: 'right' });
};

// ── Bloc émetteur seul (ex. bon de livraison) ───────────────────
const drawIssuerInfo = (doc, company, startY) => {
    const c = company ?? {};
    const name =
        (c.name && String(c.name).trim()) || 'Tokia-Loh';
    const x = 14;
    let y = startY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('ÉMETTEUR', x, y);
    y += 4.5;

    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(name, x, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);

    if (c.description && String(c.description).trim()) {
        const descLines = doc.splitTextToSize(String(c.description).trim(), 92);
        doc.text(descLines, x, y);
        y += descLines.length * 3.6 + 1.5;
    }

    const lines = [];
    if (c.address) lines.push(String(c.address));
    if (c.email) lines.push(`E-mail : ${c.email}`);
    if (c.phone) lines.push(`Tél. : ${c.phone}`);
    if (c.whatsapp) lines.push(`WhatsApp : ${c.whatsapp}`);

    lines.forEach((line, i) => {
        doc.text(line, x, y + i * 4);
    });
    y += lines.length > 0 ? lines.length * 4 + 2 : 1;

    return y + 2;
};

/** Facture : informations client à gauche (carte), émetteur à droite. */
const drawInvoiceIssuerAndClient = (doc, order, company, startY) => {
    const M = 14;
    const CONTENT_W = 182;
    const CLIENT_W = 80;
    const GAP = 20;
    const CLIENT_X = M;
    const ISSUER_X = M + CLIENT_W + GAP;
    const ISSUER_W = CONTENT_W - CLIENT_W - GAP;
    const topY = startY - 2;
    const issuerWrapW = ISSUER_W - 4;
    const c = company ?? {};
    const name = (c.name && String(c.name).trim()) || 'Tokia-Loh';

    const issuerHeadH = 4.5 + 5;
    let descH = 0;
    if (c.description && String(c.description).trim()) {
        const dl = doc.splitTextToSize(String(c.description).trim(), issuerWrapW);
        descH = dl.length * 3.6 + 1.5;
    }
    const detailLines = [];
    if (c.address) detailLines.push(String(c.address));
    if (c.email) detailLines.push(`E-mail : ${c.email}`);
    if (c.phone) detailLines.push(`Tél. : ${c.phone}`);
    if (c.whatsapp) detailLines.push(`WhatsApp : ${c.whatsapp}`);
    const detailsH =
        detailLines.length > 0 ? detailLines.length * 4 + 2 : 1;
    const issuerBlockH = issuerHeadH + descH + detailsH + 2;

    const clientRows = [
        ['Nom', `${order.client.firstName} ${order.client.lastName}`],
        ['Téléphone', order.client.phone],
        ['Ville', order.client.city],
    ];
    const valMaxW = CLIENT_W - 34;
    let rowHSum = 0;
    clientRows.forEach(([, val]) => {
        const valLines = doc.splitTextToSize(String(val ?? '—'), valMaxW);
        rowHSum += Math.max(6, valLines.length * 3.8);
    });
    const clientCardInnerH = 13 + rowHSum + 5;
    const CLIENT_MIN_H = 32;
    const boxH = Math.max(issuerBlockH, clientCardInnerH, CLIENT_MIN_H);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(CLIENT_X, topY, CLIENT_W, boxH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.text('INFORMATIONS CLIENT', CLIENT_X + 2, startY);

    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.4);
    doc.line(CLIENT_X + 2, topY + 8, CLIENT_X + CLIENT_W - 2, topY + 8);

    let cy = topY + 13;
    clientRows.forEach(([key, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.setFontSize(7.5);
        doc.text(`${key} :`, CLIENT_X + 2, cy);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        const valStr = String(val ?? '—');
        const valX = CLIENT_X + 30;
        const valLines = doc.splitTextToSize(valStr, valMaxW);
        doc.text(valLines, valX, cy);
        cy += Math.max(6, valLines.length * 3.8);
    });

    let iy = startY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('ÉMETTEUR', ISSUER_X, iy);
    iy += 4.5;
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(name, ISSUER_X, iy);
    iy += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    if (c.description && String(c.description).trim()) {
        const dl = doc.splitTextToSize(String(c.description).trim(), issuerWrapW);
        doc.text(dl, ISSUER_X, iy);
        iy += dl.length * 3.6 + 1.5;
    }
    detailLines.forEach((line) => {
        doc.text(line, ISSUER_X, iy);
        iy += 4;
    });

    return topY + boxH + 3;
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
const drawFooter = (doc, company) => {
    const pageH = doc.internal.pageSize.height;
    const footerH = 20;
    const c = company ?? {};
    const brand =
        (c.name && String(c.name).trim()) || 'Tokia-Loh';

    doc.setFillColor(...LIGHT);
    doc.rect(0, pageH - footerH, 210, footerH, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'bold');
    doc.text(brand, 14, pageH - 14);
    doc.setFont('helvetica', 'normal');
    const contact = [c.email, c.phone].filter(Boolean).join(' · ');
    if (contact) {
        doc.text(contact, 14, pageH - 9);
    }
    doc.text('Paiement à la livraison', 14, pageH - 4);
    doc.setFont('helvetica', 'italic');
    doc.text('Merci pour votre confiance !', 196, pageH - 10, { align: 'right' });
};

// ── Récapitulatif facture ─────────────────────────────────────────
const drawInvoiceRecap = (doc, order, startY) => {
    const boxX = 14;
    const boxW = 188;
    const rowH = 7.5;
    const recapH = rowH * 3;

    // Fond léger
    doc.setFillColor(...LIGHT);
    doc.rect(110, startY, 92, recapH, 'F');

    // Positionnement :
    // Largeurs colonnes (dans autoTable) : [82, 16, 42, 48], total = 182
    // On aligne le label à gauche de la zone "Prix unitaire".
    const labelLeftX = boxX + 82 + 16 + 2; // 1-2mm de padding
    const valueRightX = boxX + boxW - 2; // fin col "Total"

    const y1 = startY + 5.2;
    const y2 = y1 + rowH;
    const y3 = y2 + rowH;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);

    doc.text('Sous-total', labelLeftX, y1);
    doc.text(formatMoney(order.subtotal), valueRightX, y1, { align: 'right' });

    doc.text('Livraison', labelLeftX, y2);
    const deliveryAmt = Number(order.deliveryFee ?? 0);
    if (deliveryAmt === 0) {
        doc.text('Gratuit', valueRightX, y2, { align: 'right' });
    } else {
        doc.text(formatMoney(deliveryAmt), valueRightX, y2, { align: 'right' });
    }

    doc.text('TOTAL', labelLeftX, y3);
    doc.text(formatMoney(order.total), valueRightX, y3, { align: 'right' });

    return startY + recapH;
};

// ════════════════════════════════════════════════════════════════
// GÉNÉRATION FACTURE
// ════════════════════════════════════════════════════════════════
export const generateInvoice = async (order) => {
    const company = order.company ?? null;
    let logoDataUrl = null;
    if (company?.logo) {
        logoDataUrl = await fetchLogoAsDataUrl(company.logo);
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    drawHeader(doc, 'FACTURE', order, company, logoDataUrl);

    // Deux lignes blanches sous la bandeau d’en-tête (~5 mm par ligne)
    const FACTURE_HEADER_H = 28;
    const BLANK_LINE_MM = 5;
    const LINES_AFTER_HEADER = 2;
    let y = FACTURE_HEADER_H + LINES_AFTER_HEADER * BLANK_LINE_MM;
    y = drawInvoiceIssuerAndClient(doc, order, company, y);

    // Espace blanc avant la table des produits
    y += 10;

    // Tableau des produits
    autoTable(doc, {
        startY: y,
        head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
        body: order.items.map(item => {
            let nameDisplay = item.name;
            if (item.variants && item.variants.length > 0) {
                nameDisplay += '\n' + item.variants.map(v => `• ${v.key ? v.key.charAt(0).toUpperCase() + v.key.slice(1) : 'Déclinaison'} : ${v.name}`).join('\n');
            }
            return [
                nameDisplay,
                item.quantity,
                formatMoney(item.unitPrice),
                formatMoney(item.quantity * item.unitPrice),
            ];
        }),

        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 8.2, font: 'helvetica', cellPadding: 2, overflow: 'hidden' },
        headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 82 },
            1: { cellWidth: 16, halign: 'center' },
            2: { cellWidth: 42, halign: 'right' },
            3: { cellWidth: 48, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
    });

    // Espace blanc entre le tableau et le récapitulatif (qui est en bas)
    const recapTopY = doc.lastAutoTable.finalY + 10;
    const recapBottomY = drawInvoiceRecap(doc, order, recapTopY);

    y = recapBottomY + 8;
    y = drawNote(doc, order.note, y);
    drawFooter(doc, company);

    const fileRef = String(order.reference ?? order.id ?? 'commande')
        .replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`Facture_${fileRef}.pdf`);
};

// ════════════════════════════════════════════════════════════════
// GÉNÉRATION BON DE LIVRAISON
// ════════════════════════════════════════════════════════════════
export const generateDeliveryNote = async (order) => {
    const company = order.company ?? null;
    let logoDataUrl = null;
    if (company?.logo) {
        logoDataUrl = await fetchLogoAsDataUrl(company.logo);
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    drawHeader(doc, 'BON DE LIVRAISON', order, company, logoDataUrl);

    let y = 31;
    y = drawIssuerInfo(doc, company, y);
    y += 4;

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

    drawFooter(doc, company);

    const fileRef = String(order.reference ?? order.id ?? 'commande')
        .replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`BonLivraison_${fileRef}.pdf`);
};