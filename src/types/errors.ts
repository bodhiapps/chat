export type ErrorCategory = 'network' | 'persistence' | 'auth' | 'unknown';

export interface AppError {
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  originalError?: Error;
}

export function categorizeError(error: Error): AppError {
  const message = error.message.toLowerCase();

  if (error.name === 'QuotaExceededError' || message.includes('quota')) {
    return {
      category: 'persistence',
      message: 'Storage quota exceeded',
      retryable: false,
      originalError: error,
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      category: 'network',
      message: error.message,
      retryable: true,
      originalError: error,
    };
  }

  if (message.includes('unauthorized') || message.includes('401') || message.includes('token')) {
    return {
      category: 'auth',
      message: 'Authentication required',
      retryable: false,
      originalError: error,
    };
  }

  return {
    category: 'unknown',
    message: error.message,
    retryable: true,
    originalError: error,
  };
}

export class QuotaCleanupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaCleanupError';
  }
}
