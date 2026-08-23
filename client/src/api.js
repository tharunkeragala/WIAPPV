const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function api(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function adminHeaders() {
  const token = localStorage.getItem('wedding_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
