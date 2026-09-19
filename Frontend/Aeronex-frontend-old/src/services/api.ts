const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export async function getSimulationSnapshot() { const response = await fetch(`${API_BASE}/api/simulation`); if (!response.ok) throw new Error('Simulation API unavailable'); return response.json() }
