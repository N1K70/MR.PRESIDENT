// API client para mobile
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(()=>'');
    throw new Error(msg || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string }>(`/auth/login`, {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string }>(`/auth/register`, {
      method: 'POST', body: JSON.stringify({ name, email, password }),
    }),
};
