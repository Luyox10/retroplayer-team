const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
export const API_URL = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`;

function getToken() {
  return localStorage.getItem('token');
}

export async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const body = await res.json();
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return body.data;
}
