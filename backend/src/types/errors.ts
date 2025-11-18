/**
 * Types pour la gestion d'erreurs typées
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Non authentifié') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Non autorisé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: number | string) {
    const message = id
      ? `${resource} avec l'ID ${id} introuvable`
      : `${resource} introuvable`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 500, 'DATABASE_ERROR', originalError);
    this.name = 'DatabaseError';
  }
}

export class BusinessLogicError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Type guard pour vérifier si une erreur est une ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard pour vérifier si une erreur est une Error standard
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Formatte une erreur pour la réponse HTTP
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  code?: string;
  details?: unknown;
  statusCode: number;
} {
  if (isApiError(error)) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode
    };
  }

  if (isError(error)) {
    return {
      error: error.message,
      statusCode: 500
    };
  }

  return {
    error: 'Une erreur inconnue est survenue',
    statusCode: 500
  };
}
