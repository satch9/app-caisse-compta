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

// Services de sessions de caisse
export const sessionsCaisseService = {
  async creer(data: {
    caissier_id: number;
    fond_initial: number;
    note_ouverture?: string;
  }) {
    const response = await api.post('/sessions-caisse', data);
    return response.data;
  },

  async ouvrir(session_id: number, note_ouverture?: string) {
    const response = await api.post(`/sessions-caisse/${session_id}/ouvrir`, {
      note_ouverture
    });
    return response.data;
  },

  async fermer(session_id: number, solde_declare: number, note_fermeture?: string) {
    const response = await api.post(`/sessions-caisse/${session_id}/fermer`, {
      solde_declare,
      note_fermeture
    });
    return response.data;
  },

  async valider(
    session_id: number,
    solde_valide: number,
    statut_final: 'validee' | 'anomalie',
    note_validation?: string
  ) {
    const response = await api.post(`/sessions-caisse/${session_id}/valider`, {
      solde_valide,
      statut_final,
      note_validation
    });
    return response.data;
  },

  async getAll(params?: {
    caissier_id?: number;
    tresorier_id?: number;
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/sessions-caisse', { params });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/sessions-caisse/${id}`);
    return response.data;
  },

  async getActive() {
    const response = await api.get('/sessions-caisse/active/me');
    return response.data;
  },

  async getEnAttenteValidation() {
    const response = await api.get('/sessions-caisse/en-attente-validation/me');
    return response.data;
  },
};

// Services d'administration
export const adminService = {
  // Gestion des utilisateurs
  async getAllUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async getUserById(id: number) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async getUsersByRole(roleCode: string) {
    const response = await api.get(`/admin/users/by-role/${roleCode}`);
    return response.data;
  },

  async createUser(data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
  }) {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  async updateUser(id: number, data: {
    email?: string;
    password?: string;
    nom?: string;
    prenom?: string;
  }) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Gestion des rôles
  async getAllRoles() {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  async getAllPermissions() {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  async assignRole(userId: number, roleCode: string) {
    const response = await api.post(`/admin/users/${userId}/roles/${roleCode}`);
    return response.data;
  },

  async removeRole(userId: number, roleCode: string) {
    const response = await api.delete(`/admin/users/${userId}/roles/${roleCode}`);
    return response.data;
  },

  async grantPermission(userId: number, permissionCode: string) {
    const response = await api.post(`/admin/users/${userId}/permissions/${permissionCode}`);
    return response.data;
  },

  async revokePermission(userId: number, permissionCode: string) {
    const response = await api.delete(`/admin/users/${userId}/permissions/${permissionCode}`);
    return response.data;
  },
};
