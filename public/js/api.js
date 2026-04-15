const API_BASE = `${window.location.origin}/api`;

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

window.apiClient = { API_BASE, getToken, setToken, api };
window.api = api;
window.getToken = getToken;
window.setToken = setToken;
