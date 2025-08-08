
// make sure VITE_API_BASE_URL is set
const defaultApiBaseUrl = 'https://api.soundtrace.uk';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;


interface LoginResponse {
  token: string;
  userId: string;
  username: string;
}

const handleAuthApiResponse = async (response: Response): Promise<LoginResponse> => {
    const data = await response.json().catch(() => ({ message: `Invalid JSON response from server during auth operation. Status: ${response.status}` }));

    if (!response.ok) {
      const error = new Error(data.message || `Authentication operation failed with status: ${response.status}`);
      (error as unknown as { status?: number }).status = response.status;
      throw error;
    }

    if (!data.token || !data.userId || !data.username) {
        const error = new Error('Authentication response from server was incomplete.');
        (error as any).status = response.status;
        throw error;
    }
    return data as LoginResponse;
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    if (!BACKEND_URL) {
      const configError = new Error('Backend URL is not configured. Cannot log in.');
      (configError as unknown as { status?: number }).status = 500; // Indicate server-side configuration issue from client's perspective
      throw configError;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Added for sending cookies if needed (though login sets cookie via response)
    });

    return handleAuthApiResponse(response);
  },

  register: async (username: string, password: string): Promise<LoginResponse> => {
    if (!BACKEND_URL) {
       const configError = new Error('Backend URL is not configured. Cannot register.');
      (configError as unknown as { status?: number }).status = 500;
      throw configError;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Added for sending cookies if needed (though register sets cookie via response)
    });

    return handleAuthApiResponse(response);
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('authToken'); // jwt token, not the session cookie
    if (!BACKEND_URL) {
      return;
    }

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      // middleware mostly checks httponly cookie
      // bearer token is backup
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include', // Crucial for sending the HttpOnly soundtrace_session_token cookie
      });
      if (!response.ok) {
        await response.text().catch(()=>'Could not read error response body');
      }
    } catch {
      // Silent error handling
    }
  },
  
  deleteAccount: async (password?: string): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (!BACKEND_URL) {
      const configError = new Error('Backend URL is not configured. Cannot delete account.');
      (configError as unknown as { status?: number }).status = 500;
      throw configError;
    }

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Body will include password if provided for extra security
      const body = password ? JSON.stringify({ password }) : undefined;
      
      const response = await fetch(`${BACKEND_URL}/api/auth/account`, {
        method: 'DELETE',
        headers,
        body,
        credentials: 'include', // Crucial for sending the HttpOnly session cookie
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Failed to delete account. Status: ${response.status}` 
        }));
        
        const error = new Error(errorData.message || 'Failed to delete account');
        (error as unknown as { status?: number }).status = response.status;
        throw error;
      }
    } catch (err) {
      if ((err as Error).message) {
        throw err;
      }
      throw new Error('Failed to delete account due to a network error');
    }
  },
};
