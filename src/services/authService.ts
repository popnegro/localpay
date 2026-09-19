export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cajero';
  branch: string;
  cajaId: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

const TOKEN_KEY = 'lp_unified_token';
const USER_KEY = 'lp_unified_user';

export const authService = {
  async login(email: string, pass: string): Promise<LoginResponse> {
    try {
      // Intentar primero endpoint Vercel Serverless /api/auth/login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token && data.user) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          // Limpiar claves obsoletas de versiones anteriores
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('lp_session');
          return { success: true, token: data.token, user: data.user };
        }
      } else {
        const errData = await res.json().catch(() => ({ error: 'Error de servidor' }));
        return { success: false, error: errData.error || 'Credenciales inválidas.' };
      }
    } catch {
      // Fallback offline seguro en cliente (en caso de previsualización sin red externa)
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (cleanEmail === 'admin@localpay.com' && pass === '123456') {
        const user: AuthUser = {
          id: 'usr_admin_01',
          name: 'Administrador General',
          email: 'admin@localpay.com',
          role: 'admin',
          branch: 'Sucursal Mendoza Centro',
          cajaId: 'CAJA-01',
        };
        const token = 'lp_token_mock_' + Date.now();
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('lp_session');
        return { success: true, token, user };
      }

      if (cleanEmail === 'cajero@localpay.com' && pass === 'cajero2025') {
        const user: AuthUser = {
          id: 'usr_caja_02',
          name: 'Operador de Turno',
          email: 'cajero@localpay.com',
          role: 'cajero',
          branch: 'Sucursal Mendoza Centro',
          cajaId: 'CAJA-02',
        };
        const token = 'lp_token_mock_' + Date.now();
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('lp_session');
        return { success: true, token, user };
      }
    }

    return {
      success: false,
      error: 'Usuario o contraseña no reconocidos. Ingrese con admin@localpay.com / 123456.',
    };
  },

  getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('lp_session');
  },
};
