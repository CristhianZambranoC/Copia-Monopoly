// controllers/api.js
import { API_BASE } from "../utils/config.mjs";
export const API_URL = API_BASE;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const getCountries = () => request("/countries");
export const getBoard     = () => request("/board");
export const getRanking   = () => request("/ranking");
export const sendScore    = (nick_name, score, country_code) =>
  request("/score-recorder", {
    method: "POST",
    body: JSON.stringify({ nick_name, score, country_code }),
  });
