import { User, Task, DashboardStats, AuthResponse } from "../types.js";

const TOKEN_KEY = "tm_auth_token";
const USER_KEY = "tm_auth_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: "Failed to parse system response" };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearSession();
      // Optionally trigger reload or state update if in unauthorized state
    }
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    setSession(data.token, data.user);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setSession(data.token, data.user);
    return data;
  },

  async getMe(): Promise<User> {
    return request<User>("/api/auth/me");
  },

  // Tasks
  async getTasks(filters?: {
    search?: string;
    status?: string;
    priority?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);

    const queryStr = params.toString();
    const endpoint = `/api/tasks${queryStr ? `?${queryStr}` : ""}`;
    return request<Task[]>(endpoint);
  },

  async createTask(task: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }): Promise<Task> {
    return request<Task>("/api/tasks", {
      method: "POST",
      body: task,
    });
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: updates,
    });
  },

  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/api/dashboard/stats");
  },
};
