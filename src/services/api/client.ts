import {
  clearAuthSession,
  getAuthToken,
  setAuthToken,
} from '@/services/authStorage';

// Base API configuration and types
export const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_API_URL || 'https://api.cloudanzen.com';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiErrorShape {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// HTTP client wrapper
class ApiClient {
  public baseURL: string;
  public token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;

    // AUTH NOTE: The backend now sets an HttpOnly cookie on login, so the
    // browser sends the JWT automatically via `credentials: 'include'`.
    // The sessionStorage token below is kept as a migration fallback —
    // the backend accepts both cookie and Bearer header during the
    // transition period. Once all clients rely on the cookie, the
    // Bearer header and sessionStorage token can be removed.
    this.token = getAuthToken();
  }

  setToken(token: string) {
    this.token = token;
    setAuthToken(token);
  }

  removeToken() {
    this.token = null;
    clearAuthSession();
  }

  private buildHeaders(options: RequestInit): Headers {
    const headers = new Headers(options.headers);

    if (
      !headers.has('Content-Type') &&
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    return headers;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204 || response.status === 205) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      const text = await response.text();
      return text ? JSON.parse(text) : undefined;
    }

    if (contentType.startsWith('text/')) {
      return await response.text();
    }

    const text = await response.text();
    return text || undefined;
  }

  private toApiError(response: Response, payload: unknown): ApiError {
    if (response.status === 401) {
      clearAuthSession();
      this.token = null;
    }

    if (payload && typeof payload === 'object') {
      const errorPayload = payload as Partial<ApiErrorShape>;
      return new ApiError(
        errorPayload.error || response.statusText || 'Request failed',
        errorPayload.message || response.statusText || 'An error occurred',
        response.status,
        errorPayload.details ?? payload,
      );
    }

    if (typeof payload === 'string' && payload.trim()) {
      return new ApiError(
        response.statusText || 'Request failed',
        payload,
        response.status,
        payload,
      );
    }

    return new ApiError(
      response.statusText || 'Request failed',
      response.statusText || 'An error occurred',
      response.status,
      payload,
    );
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: this.buildHeaders(options),
      });

      const data = await this.parseResponse(response);

      if (!response.ok) {
        throw this.toApiError(response, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(
          'Request Aborted',
          'The request was cancelled before it completed.',
          0,
        );
      }

      throw new ApiError(
        'Network Error',
        'Failed to connect to the server',
        0,
        error,
      );
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const defined = Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null,
      ) as [string, string][];
      if (defined.length > 0) {
        url += `?${new URLSearchParams(defined).toString()}`;
      }
    }
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }
}

export class ApiError extends Error {
  constructor(
    public error: string,
    public message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const apiClient = new ApiClient();
