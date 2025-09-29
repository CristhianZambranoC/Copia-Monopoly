/**
 * @fileoverview Módulo de gestión de peticiones a la API del juego Monopoly
 * @module controllers/api
 */

import { API_BASE } from "../utils/config.mjs";

/** URL base de la API configurada en config.mjs */
export const API_URL = API_BASE;

/**
 * Realiza una petición HTTP a la API
 * @async
 * @param {string} path - Ruta del endpoint a consultar
 * @param {Object} [options={}] - Opciones de la petición fetch
 * @param {Object} [options.headers] - Cabeceras HTTP adicionales
 * @returns {Promise<Object|string>} Respuesta de la API (JSON o texto)
 * @throws {Error} Si la respuesta no es satisfactoria (status !== 2xx)
 */
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

/**
 * Obtiene la lista de países disponibles
 * @async
 * @returns {Promise<Array>} Array con los países disponibles
 */
export const getCountries = () => request("/countries");

/**
 * Obtiene la configuración del tablero
 * @async
 * @returns {Promise<Object>} Objeto con la configuración del tablero
 */
export const getBoard = () => request("/board");

/**
 * Obtiene el ranking de jugadores
 * @async
 * @returns {Promise<Array>} Array con el ranking de jugadores
 */
export const getRanking = () => request("/ranking");

/**
 * Envía una nueva puntuación al servidor
 * @async
 * @param {string} nick_name - Nombre del jugador
 * @param {number} score - Puntuación obtenida
 * @param {string} country_code - Código ISO del país del jugador
 * @returns {Promise<Object>} Respuesta del servidor con la confirmación
 */
export const sendScore = (nick_name, score, country_code) =>
  request("/score-recorder", {
    method: "POST",
    body: JSON.stringify({ nick_name, score, country_code }),
  });
