import ExcelJS from 'exceljs';
import {
  JournalVentesResult,
  RapportSessionsResult,
  ChiffreAffairesResult,
  VentesParProduitResult,
  ValorisationStockResult
} from './comptaService';

class ExportService {
  /**
   * Exporte le journal des ventes au format Excel
   */
  async exportJournalVentesExcel(data: JournalVentesResult): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Journal des Ventes');

    // Configuration des colonnes
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'N° Transaction', key: 'numero', width: 18 },
      { header: 'Type de paiement', key: 'type_paiement', width: 18 },
      { header: 'Montant (€)', key: 'montant', width: 15 },
      { header: 'Caissier', key: 'caissier', width: 25 },
      { header: 'Statut', key: 'statut', width: 12 }
    ];

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Bleu
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Ajouter les données
    data.transactions.forEach((transaction) => {
      const row = worksheet.addRow({
        date: this.formatDate(transaction.date),
        numero: transaction.numero,
        type_paiement: this.formatTypePaiement(transaction.type_paiement),
        montant: transaction.montant,
        caissier: transaction.caissier,
        statut: this.formatStatut(transaction.statut)
      });

      // Format monétaire pour la colonne montant
      const montantCell = row.getCell('montant');
      montantCell.numFmt = '#,##0.00 "€"';
      montantCell.alignment = { horizontal: 'right' };

      // Couleur de fond selon le statut
      if (transaction.statut === 'annulee') {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // Rouge clair
        };
      }
    });

    // Ligne vide
    worksheet.addRow({});

    // Lignes de totaux
    const totauxStartRow = worksheet.rowCount + 1;

    worksheet.addRow({
      date: '',
      numero: '',
      type_paiement: 'TOTAL ESPÈCES',
      montant: data.totaux.especes,
      caissier: '',
      statut: ''
    });

    worksheet.addRow({
      date: '',
      numero: '',
      type_paiement: 'TOTAL CHÈQUES',
      montant: data.totaux.cheque,
      caissier: '',
      statut: ''
    });

    worksheet.addRow({
      date: '',
      numero: '',
      type_paiement: 'TOTAL CB',
      montant: data.totaux.cb,
      caissier: '',
      statut: ''
    });

    worksheet.addRow({
      date: '',
      numero: '',
      type_paiement: 'TOTAL GÉNÉRAL',
      montant: data.totaux.total,
      caissier: '',
      statut: ''
    });

    // Style des lignes de totaux
    for (let i = totauxStartRow; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.font = { bold: true };
      row.getCell('type_paiement').alignment = { horizontal: 'right' };
      row.getCell('montant').numFmt = '#,##0.00 "€"';
      row.getCell('montant').alignment = { horizontal: 'right' };

      if (i === worksheet.rowCount) {
        // Ligne total général en bleu
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' } // Bleu clair
        };
      }
    }

    // Bordures pour toutes les cellules avec données
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 0) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Formate une date au format français
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formate le type de paiement
   */
  private formatTypePaiement(type: string): string {
    const types: { [key: string]: string } = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'cb': 'Carte Bancaire'
    };
    return types[type] || type;
  }

  /**
   * Formate le statut
   */
  private formatStatut(statut: string): string {
    const statuts: { [key: string]: string } = {
      'validee': 'Validée',
      'annulee': 'Annulée',
      'en_attente': 'En attente'
    };
    return statuts[statut] || statut;
  }

  /**
   * Exporte le rapport des sessions de caisse au format Excel
   */
  async exportRapportSessionsExcel(data: RapportSessionsResult): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sessions de Caisse');

    // Configuration des colonnes
    worksheet.columns = [
      { header: 'Date ouverture', key: 'date_ouverture', width: 20 },
      { header: 'Date fermeture', key: 'date_fermeture', width: 20 },
      { header: 'Caissier', key: 'caissier', width: 25 },
      { header: 'Fond initial (€)', key: 'fond_initial', width: 15 },
      { header: 'Solde attendu (€)', key: 'solde_attendu', width: 15 },
      { header: 'Solde réel (€)', key: 'solde_valide', width: 15 },
      { header: 'Écart (€)', key: 'ecart', width: 12 },
      { header: 'Statut', key: 'statut', width: 12 }
    ];

    // Style de l'en-tête
    this.styleHeader(worksheet);

    // Ajouter les données
    data.sessions.forEach((session) => {
      const row = worksheet.addRow({
        date_ouverture: this.formatDate(session.date_ouverture),
        date_fermeture: session.date_fermeture ? this.formatDate(session.date_fermeture) : 'En cours',
        caissier: session.caissier,
        fond_initial: session.fond_initial,
        solde_attendu: session.solde_attendu,
        solde_valide: session.solde_valide || '',
        ecart: session.ecart || '',
        statut: this.formatStatut(session.statut)
      });

      // Format monétaire
      ['fond_initial', 'solde_attendu', 'solde_valide', 'ecart'].forEach(col => {
        const cell = row.getCell(col);
        if (cell.value) {
          cell.numFmt = '#,##0.00 "€"';
          cell.alignment = { horizontal: 'right' };
        }
      });

      // Couleur selon écart
      if (session.ecart && Math.abs(session.ecart) > 5) {
        row.getCell('ecart').font = { color: { argb: 'FFEF4444' }, bold: true };
      }
    });

    // Ligne vide
    worksheet.addRow({});

    // Total des écarts
    const totalRow = worksheet.addRow({
      date_ouverture: '',
      date_fermeture: '',
      caissier: '',
      fond_initial: '',
      solde_attendu: '',
      solde_valide: '',
      ecart: data.total_ecarts,
      statut: 'TOTAL ÉCARTS'
    });
    totalRow.font = { bold: true };
    totalRow.getCell('ecart').numFmt = '#,##0.00 "€"';
    totalRow.getCell('ecart').alignment = { horizontal: 'right' };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };

    // Bordures
    this.addBorders(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Exporte le chiffre d'affaires au format Excel
   */
  async exportChiffreAffairesExcel(data: ChiffreAffairesResult, groupBy: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Chiffre d\'Affaires');

    // KPIs en haut
    worksheet.mergeCells('A1:B1');
    worksheet.getCell('A1').value = 'INDICATEURS CLÉS';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    worksheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' } };

    worksheet.getCell('A2').value = 'CA Total';
    worksheet.getCell('B2').value = data.total;
    worksheet.getCell('B2').numFmt = '#,##0.00 "€"';
    worksheet.getCell('A2').font = { bold: true };

    worksheet.getCell('A3').value = 'Nombre de transactions';
    worksheet.getCell('B3').value = data.nb_total_transactions;
    worksheet.getCell('A3').font = { bold: true };

    worksheet.getCell('A4').value = 'Panier moyen';
    worksheet.getCell('B4').value = data.panier_moyen;
    worksheet.getCell('B4').numFmt = '#,##0.00 "€"';
    worksheet.getCell('A4').font = { bold: true };

    // Ligne vide
    worksheet.addRow({});
    worksheet.addRow({});

    // Données par période
    const headerRow = worksheet.addRow(['Période', 'Montant (€)', 'Nb transactions']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    data.data.forEach((item) => {
      const row = worksheet.addRow([item.periode, item.montant, item.nb_transactions]);
      row.getCell(2).numFmt = '#,##0.00 "€"';
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).alignment = { horizontal: 'center' };
    });

    worksheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 18 }
    ];

    this.addBorders(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Exporte les ventes par produit au format Excel
   */
  async exportVentesParProduitExcel(data: VentesParProduitResult): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Feuille 1: Top produits
    const ws1 = workbook.addWorksheet('Top Produits');
    ws1.columns = [
      { header: 'Produit', key: 'produit_nom', width: 30 },
      { header: 'Catégorie', key: 'categorie_nom', width: 20 },
      { header: 'Quantité vendue', key: 'quantite_vendue', width: 18 },
      { header: 'CA Total (€)', key: 'ca_total', width: 15 },
      { header: 'Prix moyen (€)', key: 'prix_moyen', width: 15 }
    ];

    this.styleHeader(ws1);

    data.produits.forEach((produit) => {
      const row = ws1.addRow({
        produit_nom: produit.produit_nom,
        categorie_nom: produit.categorie_nom,
        quantite_vendue: produit.quantite_vendue,
        ca_total: produit.ca_total,
        prix_moyen: produit.prix_moyen
      });

      row.getCell('quantite_vendue').alignment = { horizontal: 'center' };
      row.getCell('ca_total').numFmt = '#,##0.00 "€"';
      row.getCell('ca_total').alignment = { horizontal: 'right' };
      row.getCell('prix_moyen').numFmt = '#,##0.00 "€"';
      row.getCell('prix_moyen').alignment = { horizontal: 'right' };
    });

    this.addBorders(ws1);

    // Feuille 2: Par catégorie
    const ws2 = workbook.addWorksheet('Par Catégorie');
    ws2.columns = [
      { header: 'Catégorie', key: 'categorie_nom', width: 30 },
      { header: 'CA Total (€)', key: 'ca_total', width: 18 },
      { header: 'Quantité vendue', key: 'quantite_vendue', width: 18 }
    ];

    this.styleHeader(ws2);

    data.par_categorie.forEach((cat) => {
      const row = ws2.addRow({
        categorie_nom: cat.categorie_nom,
        ca_total: cat.ca_total,
        quantite_vendue: cat.quantite_vendue
      });

      row.getCell('ca_total').numFmt = '#,##0.00 "€"';
      row.getCell('ca_total').alignment = { horizontal: 'right' };
      row.getCell('quantite_vendue').alignment = { horizontal: 'center' };
    });

    this.addBorders(ws2);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Exporte la valorisation du stock au format Excel
   */
  async exportValorisationStockExcel(data: ValorisationStockResult): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Valorisation Stock');

    // KPIs en haut
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'VALORISATION GLOBALE';
    worksheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };

    worksheet.getCell('A2').value = 'Valeur stock (achat)';
    worksheet.getCell('B2').value = data.total_valeur_achat;
    worksheet.getCell('B2').numFmt = '#,##0.00 "€"';
    worksheet.getCell('A2').font = { bold: true };

    worksheet.getCell('A3').value = 'Valeur stock (vente)';
    worksheet.getCell('B3').value = data.total_valeur_vente;
    worksheet.getCell('B3').numFmt = '#,##0.00 "€"';
    worksheet.getCell('A3').font = { bold: true };

    worksheet.getCell('A4').value = 'Marge potentielle';
    worksheet.getCell('B4').value = data.marge_potentielle;
    worksheet.getCell('B4').numFmt = '#,##0.00 "€"';
    worksheet.getCell('A4').font = { bold: true };
    worksheet.getCell('B4').font = { bold: true, color: { argb: 'FF10B981' } };

    // Ligne vide
    worksheet.addRow({});
    worksheet.addRow({});

    // Détail par catégorie
    const headerRow = worksheet.addRow([
      'Catégorie',
      'Valeur achat (€)',
      'Valeur vente (€)',
      'Marge (€)'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    data.par_categorie.forEach((cat) => {
      const row = worksheet.addRow([
        cat.categorie_nom,
        cat.valeur_achat,
        cat.valeur_vente,
        cat.marge
      ]);

      row.getCell(2).numFmt = '#,##0.00 "€"';
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).numFmt = '#,##0.00 "€"';
      row.getCell(3).alignment = { horizontal: 'right' };
      row.getCell(4).numFmt = '#,##0.00 "€"';
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(4).font = { color: { argb: 'FF10B981' } };
    });

    worksheet.columns = [
      { width: 30 },
      { width: 18 },
      { width: 18 },
      { width: 15 }
    ];

    this.addBorders(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Applique le style d'en-tête standard
   */
  private styleHeader(worksheet: ExcelJS.Worksheet): void {
    worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;
  }

  /**
   * Ajoute des bordures à toutes les cellules
   */
  private addBorders(worksheet: ExcelJS.Worksheet): void {
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 0) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }
}

export default new ExportService();
