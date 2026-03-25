import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '../Button';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const PERIOD_LABELS = {
    day: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois',
};

// ── Export CSV natif (sans lib) ────────────────────────────────
const exportCSV = (products, categories, period) => {
    const periodLabel = PERIOD_LABELS[period] ?? period;

    // Feuille produits
    const productRows = [
        ['Rang', 'Produit', 'Catégorie', 'Quantité vendue', 'CA généré (F)', 'Tendance'],
        ...products.map(r => [r.rank, r.name, r.category, r.qty, r.ca, r.trend]),
    ];

    // Feuille catégories
    const categoryRows = [
        ['Catégorie', 'CA généré (F)', 'Commandes'],
        ...categories.map(r => [r.category, r.ca, r.orders]),
    ];

    const toCSVString = (rows) =>
        rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const csvContent = [
        `Rapport Tokia-Loh — ${periodLabel}`,
        '',
        '== TOP PRODUITS ==',
        toCSVString(productRows),
        '',
        '== VENTES PAR CATÉGORIE ==',
        toCSVString(categoryRows),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport_TokiaLoh_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

// ── Export PDF ─────────────────────────────────────────────────
const exportPDF = (products, categories, period) => {
    const periodLabel = PERIOD_LABELS[period] ?? period;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const BLUE = [14, 165, 233];
    const VIOLET = [139, 92, 246];
    const DARK = [15, 23, 42];
    const LIGHT = [241, 245, 249];

    // En-tête
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TL  Tokia-Loh', 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 230, 255);
    doc.text(`Rapport analytique — ${periodLabel}`, 14, 23);
    doc.setTextColor(200, 230, 255);
    doc.text(new Date().toLocaleDateString('fr-FR'), 196, 23, { align: 'right' });

    let y = 36;

    // Tableau top produits
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('TOP PRODUITS VENDUS', 14, y);

    autoTable(doc, {
        startY: y + 4,
        head: [['#', 'Produit', 'Catégorie', 'Qté', 'CA généré']],
        body: products.map(r => [r.rank, r.name, r.category, `${r.qty} unités`, formatPrice(r.ca)]),
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
        headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;

    // Tableau catégories
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('VENTES PAR CATÉGORIE', 14, y);

    autoTable(doc, {
        startY: y + 4,
        head: [['Catégorie', 'CA généré', 'Commandes']],
        body: categories.map(r => [r.category, formatPrice(r.ca), `${r.orders} cmd`]),
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
        headStyles: { fillColor: VIOLET, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const pageH = doc.internal.pageSize.height;
    doc.setFillColor(...LIGHT);
    doc.rect(0, pageH - 12, 210, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Tokia-Loh — Rapport généré automatiquement', 14, pageH - 5);
    doc.text(`Page 1`, 196, pageH - 5, { align: 'right' });

    doc.save(`Rapport_TokiaLoh_${period}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const ReportExporter = ({ products, categories, period }) => {
    const [loadingCSV, setLoadingCSV] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);

    const handleCSV = async () => {
        setLoadingCSV(true);
        await new Promise(r => setTimeout(r, 500));
        exportCSV(products, categories, period);
        setLoadingCSV(false);
    };

    const handlePDF = async () => {
        setLoadingPDF(true);
        await new Promise(r => setTimeout(r, 500));
        exportPDF(products, categories, period);
        setLoadingPDF(false);
    };

    return (
        <div className="
            flex flex-wrap items-center justify-between gap-4
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-3 px-5 py-4
        ">
            <div>
                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                    Exporter le rapport
                </p>
                <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                    Téléchargez les données de la période sélectionnée
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant="outline"
                    size="normal"
                    icon={loadingCSV ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                    onClick={handleCSV}
                    disabled={loadingCSV}
                >
                    Exporter CSV
                </Button>
                <Button
                    variant="primary"
                    size="normal"
                    icon={loadingPDF ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    onClick={handlePDF}
                    disabled={loadingPDF}
                >
                    Exporter PDF
                </Button>
            </div>
        </div>
    );
};

export default ReportExporter;