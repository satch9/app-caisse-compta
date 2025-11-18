import { useReducer } from 'react';
import type { Dispatch } from 'react';

// Types
export interface Produit {
  id: number;
  nom: string;
  prix_vente: number;
  stock_actuel: number;
  categorie_nom?: string;
  niveau_stock: 'normal' | 'alerte' | 'critique';
}

export interface LignePanier {
  produit: Produit;
  quantite: number;
}

export type TypePaiement = 'especes' | 'cheque' | 'cb';

export interface SoldeCaisse {
  especes: number;
  cheques: number;
  cb: number;
  total: number;
}

export interface Transaction {
  id: number;
  type_paiement: string;
  montant_total: number | string;
  created_at: string;
  statut: string;
  caissier_nom?: string;
  caissier_prenom?: string;
  reference_cheque?: string;
  reference_cb?: string;
  montant_recu?: number | string;
  montant_rendu?: number | string;
}

export interface SessionCaisse {
  id: number;
  tresorier_id: number;
  caissier_id: number;
  creee_at: string;
  ouverte_at: string | null;
  fermee_at: string | null;
  validee_at: string | null;
  fond_initial: number;
  solde_attendu: number | null;
  solde_declare: number | null;
  solde_valide: number | null;
  ecart: number | null;
  statut: 'en_attente_caissier' | 'ouverte' | 'en_attente_validation' | 'validee' | 'anomalie';
  note_ouverture: string | null;
  note_fermeture: string | null;
  note_validation: string | null;
  tresorier_nom?: string;
  tresorier_prenom?: string;
  caissier_nom?: string;
  caissier_prenom?: string;
}

export type ActiveInput =
  | 'montant_recu'
  | 'reference_cheque'
  | 'reference_cb'
  | 'monnaieur_recu'
  | 'monnaieur_rendu'
  | 'solde_declare'
  | null;

// État global
export interface CaisseState {
  // Produits et panier
  produits: Produit[];
  panier: LignePanier[];
  recherche: string;

  // Paiement
  typePaiement: TypePaiement;
  referenceCheque: string;
  referenceCB: string;
  montantRecu: string;
  montantMonnaieurRecu: string;
  montantMonnaieurRendu: string;

  // Session
  sessionActive: SessionCaisse | null;
  noteOuverture: string;
  soldeDeclare: string;
  noteFermeture: string;

  // Modals
  showSuccessModal: boolean;
  showHistorique: boolean;
  showAnnulation: boolean;
  showOuvrirSession: boolean;
  showFermerSession: boolean;

  // Transactions
  transactions: Transaction[];
  transactionIdAnnulation: string;
  raisonAnnulation: string;
  lastTransactionAmount: number;

  // Caisse
  soldeCaisse: SoldeCaisse;

  // UI
  loading: boolean;
  activeInput: ActiveInput;
}

// Actions
export type CaisseAction =
  | { type: 'SET_PRODUITS'; payload: Produit[] }
  | { type: 'SET_PANIER'; payload: LignePanier[] }
  | { type: 'ADD_TO_PANIER'; payload: Produit }
  | { type: 'UPDATE_QUANTITE'; payload: { produitId: number; quantite: number } }
  | { type: 'REMOVE_FROM_PANIER'; payload: number }
  | { type: 'CLEAR_PANIER' }
  | { type: 'SET_RECHERCHE'; payload: string }
  | { type: 'SET_TYPE_PAIEMENT'; payload: TypePaiement }
  | { type: 'SET_REFERENCE_CHEQUE'; payload: string }
  | { type: 'SET_REFERENCE_CB'; payload: string }
  | { type: 'SET_MONTANT_RECU'; payload: string }
  | { type: 'SET_MONTANT_MONNAIEUR_RECU'; payload: string }
  | { type: 'SET_MONTANT_MONNAIEUR_RENDU'; payload: string }
  | { type: 'SET_SESSION_ACTIVE'; payload: SessionCaisse | null }
  | { type: 'SET_NOTE_OUVERTURE'; payload: string }
  | { type: 'SET_SOLDE_DECLARE'; payload: string }
  | { type: 'SET_NOTE_FERMETURE'; payload: string }
  | { type: 'SET_SHOW_SUCCESS_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_HISTORIQUE'; payload: boolean }
  | { type: 'SET_SHOW_ANNULATION'; payload: boolean }
  | { type: 'SET_SHOW_OUVRIR_SESSION'; payload: boolean }
  | { type: 'SET_SHOW_FERMER_SESSION'; payload: boolean }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_TRANSACTION_ID_ANNULATION'; payload: string }
  | { type: 'SET_RAISON_ANNULATION'; payload: string }
  | { type: 'SET_LAST_TRANSACTION_AMOUNT'; payload: number }
  | { type: 'SET_SOLDE_CAISSE'; payload: SoldeCaisse }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_INPUT'; payload: ActiveInput }
  | { type: 'KEYPAD_DIGIT'; payload: string }
  | { type: 'KEYPAD_CLEAR' }
  | { type: 'RESET_PAIEMENT_FORM' }
  | { type: 'RESET_MONNAIEUR_FORM' }
  | { type: 'RESET_SESSION_FORM' };

// État initial
const initialState: CaisseState = {
  produits: [],
  panier: [],
  recherche: '',
  typePaiement: 'especes',
  referenceCheque: '',
  referenceCB: '',
  montantRecu: '',
  montantMonnaieurRecu: '',
  montantMonnaieurRendu: '',
  sessionActive: null,
  noteOuverture: '',
  soldeDeclare: '',
  noteFermeture: '',
  showSuccessModal: false,
  showHistorique: false,
  showAnnulation: false,
  showOuvrirSession: false,
  showFermerSession: false,
  transactions: [],
  transactionIdAnnulation: '',
  raisonAnnulation: '',
  lastTransactionAmount: 0,
  soldeCaisse: {
    especes: 0,
    cheques: 0,
    cb: 0,
    total: 0
  },
  loading: false,
  activeInput: null
};

// Reducer
function caisseReducer(state: CaisseState, action: CaisseAction): CaisseState {
  switch (action.type) {
    case 'SET_PRODUITS':
      return { ...state, produits: action.payload };

    case 'SET_PANIER':
      return { ...state, panier: action.payload };

    case 'ADD_TO_PANIER': {
      const produit = action.payload;
      const ligneExistante = state.panier.find(l => l.produit.id === produit.id);

      if (ligneExistante) {
        return {
          ...state,
          panier: state.panier.map(l =>
            l.produit.id === produit.id
              ? { ...l, quantite: Math.min(l.quantite + 1, produit.stock_actuel) }
              : l
          )
        };
      }

      return {
        ...state,
        panier: [...state.panier, { produit, quantite: 1 }]
      };
    }

    case 'UPDATE_QUANTITE': {
      const { produitId, quantite } = action.payload;
      return {
        ...state,
        panier: state.panier.map(l =>
          l.produit.id === produitId
            ? { ...l, quantite: Math.max(1, Math.min(quantite, l.produit.stock_actuel)) }
            : l
        )
      };
    }

    case 'REMOVE_FROM_PANIER':
      return {
        ...state,
        panier: state.panier.filter(l => l.produit.id !== action.payload)
      };

    case 'CLEAR_PANIER':
      return { ...state, panier: [] };

    case 'SET_RECHERCHE':
      return { ...state, recherche: action.payload };

    case 'SET_TYPE_PAIEMENT':
      return { ...state, typePaiement: action.payload };

    case 'SET_REFERENCE_CHEQUE':
      return { ...state, referenceCheque: action.payload };

    case 'SET_REFERENCE_CB':
      return { ...state, referenceCB: action.payload };

    case 'SET_MONTANT_RECU':
      return { ...state, montantRecu: action.payload };

    case 'SET_MONTANT_MONNAIEUR_RECU':
      return { ...state, montantMonnaieurRecu: action.payload };

    case 'SET_MONTANT_MONNAIEUR_RENDU':
      return { ...state, montantMonnaieurRendu: action.payload };

    case 'SET_SESSION_ACTIVE':
      return { ...state, sessionActive: action.payload };

    case 'SET_NOTE_OUVERTURE':
      return { ...state, noteOuverture: action.payload };

    case 'SET_SOLDE_DECLARE':
      return { ...state, soldeDeclare: action.payload };

    case 'SET_NOTE_FERMETURE':
      return { ...state, noteFermeture: action.payload };

    case 'SET_SHOW_SUCCESS_MODAL':
      return { ...state, showSuccessModal: action.payload };

    case 'SET_SHOW_HISTORIQUE':
      return { ...state, showHistorique: action.payload };

    case 'SET_SHOW_ANNULATION':
      return { ...state, showAnnulation: action.payload };

    case 'SET_SHOW_OUVRIR_SESSION':
      return { ...state, showOuvrirSession: action.payload };

    case 'SET_SHOW_FERMER_SESSION':
      return { ...state, showFermerSession: action.payload };

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'SET_TRANSACTION_ID_ANNULATION':
      return { ...state, transactionIdAnnulation: action.payload };

    case 'SET_RAISON_ANNULATION':
      return { ...state, raisonAnnulation: action.payload };

    case 'SET_LAST_TRANSACTION_AMOUNT':
      return { ...state, lastTransactionAmount: action.payload };

    case 'SET_SOLDE_CAISSE':
      return { ...state, soldeCaisse: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ACTIVE_INPUT':
      return { ...state, activeInput: action.payload };

    case 'KEYPAD_DIGIT': {
      const digit = action.payload;
      const input = state.activeInput;

      if (!input) return state;

      switch (input) {
        case 'montant_recu':
          return { ...state, montantRecu: state.montantRecu + digit };
        case 'reference_cheque':
          return { ...state, referenceCheque: state.referenceCheque + digit };
        case 'reference_cb':
          return { ...state, referenceCB: state.referenceCB + digit };
        case 'monnaieur_recu':
          return { ...state, montantMonnaieurRecu: state.montantMonnaieurRecu + digit };
        case 'monnaieur_rendu':
          return { ...state, montantMonnaieurRendu: state.montantMonnaieurRendu + digit };
        case 'solde_declare':
          return { ...state, soldeDeclare: state.soldeDeclare + digit };
        default:
          return state;
      }
    }

    case 'KEYPAD_CLEAR': {
      const input = state.activeInput;

      if (!input) return state;

      switch (input) {
        case 'montant_recu':
          return { ...state, montantRecu: '' };
        case 'reference_cheque':
          return { ...state, referenceCheque: '' };
        case 'reference_cb':
          return { ...state, referenceCB: '' };
        case 'monnaieur_recu':
          return { ...state, montantMonnaieurRecu: '' };
        case 'monnaieur_rendu':
          return { ...state, montantMonnaieurRendu: '' };
        case 'solde_declare':
          return { ...state, soldeDeclare: '' };
        default:
          return state;
      }
    }

    case 'RESET_PAIEMENT_FORM':
      return {
        ...state,
        typePaiement: 'especes',
        referenceCheque: '',
        referenceCB: '',
        montantRecu: ''
      };

    case 'RESET_MONNAIEUR_FORM':
      return {
        ...state,
        montantMonnaieurRecu: '',
        montantMonnaieurRendu: '',
        activeInput: null
      };

    case 'RESET_SESSION_FORM':
      return {
        ...state,
        noteOuverture: '',
        soldeDeclare: '',
        noteFermeture: '',
        showOuvrirSession: false,
        showFermerSession: false,
        activeInput: null
      };

    default:
      return state;
  }
}

// Hook personnalisé
export function useCaisseReducer(): [CaisseState, Dispatch<CaisseAction>] {
  return useReducer(caisseReducer, initialState);
}
