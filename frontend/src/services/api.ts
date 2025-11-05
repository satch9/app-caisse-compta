import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Rediriger vers login si non authentifié
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Services d'authentification
export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async register(email: string, password: string, nom: string, prenom: string) {
    const response = await api.post('/auth/register', { email, password, nom, prenom });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async getPermissions() {
    const response = await api.get('/auth/me/permissions');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};

// Services de produits
export const produitsService = {
  async getAll(params?: {
    categorie_id?: number;
    actifs_seulement?: boolean;
    recherche?: string;
  }) {
    const response = await api.get('/produits', { params });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/produits/${id}`);
    return response.data;
  },

  async getAlertes() {
    const response = await api.get('/produits/alertes/stock');
    return response.data;
  },
};

// Services de transactions
export const transactionsService = {
  async create(data: {
    user_id: number;
    type_paiement: 'especes' | 'cheque' | 'cb' | 'monnaie';
    lignes?: Array<{
      produit_id: number;
      quantite: number;
      prix_unitaire: number;
    }>;
    reference_cheque?: string;
    reference_cb?: string;
    montant_recu?: number;
    montant_rendu?: number;
  }) {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async getAll(params?: {
    caissier_id?: number;
    user_id?: number;
    type_paiement?: string;
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async cancel(id: number, raison: string) {
    const response = await api.delete(`/transactions/${id}`, {
      data: { raison }
    });
    return response.data;
  },
};
