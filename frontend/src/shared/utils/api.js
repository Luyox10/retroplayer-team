const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

export { API_URL };
