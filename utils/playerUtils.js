// player.utils.js
// Funciones puras y reutilizables para la clase Player (sin tocar el DOM)

/**
 * Normaliza la lista de países proveniente del backend.
 * El backend devuelve: [ { "co": "Colombia" }, { "us": "Estados Unidos" }, ... ]
 * Retorna: [ { code: "CO", name: "Colombia" }, ... ]
 */
export function normalizeCountries(list) {
  const out = [];
  for (const obj of list || []) {
    const [k, v] = Object.entries(obj)[0] || [];
    if (!k || !v) continue;
    out.push({ code: String(k).toUpperCase(), name: String(v) });
  }
  return out;
}

/** Busca el país por code (case-insensitive) en una lista normalizada */
export function resolveCountryInfo(normalizedList, code) {
  if (!code) return null;
  const target = String(code).trim().toUpperCase();
  return (normalizedList || []).find(x => x.code === target) || null;
}

/** Valida si un code existe en la lista normalizada */
export function isValidCountryCode(normalizedList, code) {
  return !!resolveCountryInfo(normalizedList, code);
}

/** Devuelve URL de banderita (48x36) usando flagcdn (lightweight) */
export function getFlagUrl(code) {
  if (!code) return null;
  const cc = String(code).trim().toLowerCase();
  return `https://flagcdn.com/48x36/${cc}.png`;
}

/**
 * Lógica de avance en el tablero detectando si se pasó por Salida.
 * @returns { newPos, passed }
 */
export function passedGo(prevPos, steps, boardSize = 40) {
  const sanitizedSteps = Number.isFinite(steps) ? Math.trunc(steps) : 0;
  const start = Number.isFinite(prevPos) ? prevPos : 0;
  const newPos = ((start + sanitizedSteps) % boardSize + boardSize) % boardSize; // seguro para valores negativos
  const passed = sanitizedSteps > 0 && newPos < start;
  return { newPos, passed };
}

/**
 * Calcula el patrimonio del jugador.
 * - Dinero disponible
 * - + valor de compra de propiedades
 * - + valor de construcciones (4 casas * 100, hotel * 200)
 * - - propiedades hipotecadas (se resta el valor hipotecado)
 * NOTA: Se asume que cada propiedad del jugador puede llevar campos runtime:
 *   { price, mortgage, houses (0..4), hotel (boolean), isMortgaged (boolean) }
 */
export function calcNetWorth(player) {
  if (!player) return 0;
  let total = Number(player.dinero) || 0;

  const props = Array.isArray(player.propiedades) ? player.propiedades : [];
  const mortgaged = Array.isArray(player.propiedadesHipotecadas) ? player.propiedadesHipotecadas : [];

  for (const p of props) {
    total += Number(p.price || 0);
    const houses = Number(p.houses || 0);
    const hasHotel = !!p.hotel;
    total += houses * 100 + (hasHotel ? 200 : 0);
  }

  for (const p of mortgaged) {
    total -= Number(p.mortgage || 0);
  }
  return total;
}

/** Valor que te da el banco al hipotecar una propiedad */
export function mortgageValue(property) {
  if (!property) return 0;
  return Number(property.mortgage || 0);
}

/** Costo para deshipotecar = mortgage + 10% */
export function unmortgageCost(property) {
  const m = mortgageValue(property);
  return Math.ceil(m + m * 0.10);
}

/** Payload para enviar score al backend */
export function toScorePayload(player) {
  return {
    nick_name: player?.nickname || "",
    score: calcNetWorth(player),
    country_code: (player?.countryCode || "").toUpperCase()
  };
}
