// Service per gestire tutte le chiamate API al server locale
// TODO: Sostituire 'http://localhost:3001' con l'indirizzo del tuo server

const API_BASE_URL = 'http://localhost:3001/api';

interface User {
  id?: number;
  username: string;
  password: string;
  isAdmin: boolean;
}

interface Deadline {
  id?: number;
  title: string;
  description: string;
  date: string;
  time: string;
  category: string;
  priority: 'bassa' | 'media' | 'alta';
  prealert: string[];
  assignedTo: string[];
  completed: boolean;
  createdBy: string;
  createdAt?: string;
}

interface ActivityLog {
  id?: number;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

class ApiService {
  private token: string | null = localStorage.getItem('token');

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Autenticazione
  async login(username: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    return data;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  // Gestione utenti
  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Gestione scadenze
  async getDeadlines(): Promise<Deadline[]> {
    return this.request('/deadlines');
  }

  async createDeadline(deadline: Omit<Deadline, 'id' | 'createdAt'>): Promise<Deadline> {
    return this.request('/deadlines', {
      method: 'POST',
      body: JSON.stringify(deadline),
    });
  }

  async updateDeadline(id: number, deadline: Partial<Deadline>): Promise<Deadline> {
    return this.request(`/deadlines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deadline),
    });
  }

  async deleteDeadline(id: number): Promise<void> {
    return this.request(`/deadlines/${id}`, {
      method: 'DELETE',
    });
  }

  async completeDeadline(id: number): Promise<Deadline> {
    return this.request(`/deadlines/${id}/complete`, {
      method: 'PATCH',
    });
  }

  // Log attività
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.request('/logs');
  }

  // Categorie
  async getCategories(): Promise<string[]> {
    return this.request('/categories');
  }

  async createCategory(name: string): Promise<string> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteCategory(name: string): Promise<void> {
    return this.request(`/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export type { User, Deadline, ActivityLog };