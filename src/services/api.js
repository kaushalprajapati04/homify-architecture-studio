const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export function getToken() {
  return localStorage.getItem('homify_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('homify_token', token);
  else localStorage.removeItem('homify_token');
}

export function getTokenSafe() {
  try { return getToken(); } catch { return null; }
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw { status: 0, message: 'Cannot connect to Homify API. Start the backend on port 5000.', isNetworkError: true };
  }

  let data = null;
  try { data = await response.json(); } catch {}
  if (response.status === 401) {
    setToken(null);
    throw { status: 401, message: data?.error || 'Your session has expired. Please log in again.' };
  }
  if (!response.ok) throw { status: response.status, message: data?.error || `Request failed (${response.status})`, data };
  return data;
}

export const api = {
  get: path => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: path => request(path, { method: 'DELETE' }),
};
