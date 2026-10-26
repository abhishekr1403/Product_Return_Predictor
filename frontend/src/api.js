// API constants and call helpers

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function predictReturn(payload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || JSON.stringify(err);
    } catch (_) { /* ignore */ }
    throw new Error(msg);
  }

  return res.json();
}

export async function fetchModelInfo() {
  const res = await fetch(`${API_BASE}/model/info`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
