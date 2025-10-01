// player.service.js
// Capa de servicio específica del dominio "Player" (reusa api.js y utils).
// No modifica api.js.

import { getCountries, sendScore } from "./api.js";
import {
  normalizeCountries,
  resolveCountryInfo,
  toScorePayload,
} from "../utils/playerUtils.js"; 

/** Descarga países y devuelve la info normalizada del code (o null si no existe) */
export async function fetchCountryInfoByCode(code) {
  const raw = await getCountries();
  const normalized = normalizeCountries(raw);
  return resolveCountryInfo(normalized, code);
}

/** Bool de validación del país */
export async function validateCountryCodeService(code) {
  const info = await fetchCountryInfoByCode(code);
  return { isValid: !!info, country: info };
}

/** Envía el score de un Player (objeto o instancia) */
export async function submitPlayerScoreService(player) {
  const payload = toScorePayload(player);
  return await sendScore(payload.nick_name, payload.score, payload.country_code);
}
