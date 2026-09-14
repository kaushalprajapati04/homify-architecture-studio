import { api, setToken } from './api';

export async function registerUser({ name, email, password }) {
  const data = await api.post('/auth/register', { name, email, password });
  setToken(data.token);
  return data;
}

export async function loginUser({ email, password }) {
  const data = await api.post('/auth/login', { email, password });
  setToken(data.token);
  return data;
}

export async function logoutUser() {
  setToken(null);
}

export async function getCurrentUser() {
  const data = await api.get('/auth/me');
  return data.user;
}
