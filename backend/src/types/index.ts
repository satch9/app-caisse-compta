import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  is_active: boolean;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface Role {
  id: number;
  code: string;
  nom: string;
  description?: string;
}

export interface Permission {
  id: number;
  code: string;
  categorie: string;
  nom: string;
  description?: string;
}
