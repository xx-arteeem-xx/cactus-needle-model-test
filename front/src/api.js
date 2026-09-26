const BASE = '/api';

async function request(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-json error page
  }
  if (!res.ok) {
    const message = body?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const api = {
  meta: () => request('/meta'),
  generations: (limit = 50) => request(`/generations?limit=${limit}`),
  stats: () => request('/stats'),
  generate: (payload) => request('/generate', { method: 'POST', body: JSON.stringify(payload) }),
  reset: () => request('/generations', { method: 'DELETE' }),
};
