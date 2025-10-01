// controllers/property.service.js
import { getBoard } from "./api.js";
import { normalizeBoardProperty, groupKeyFor } from "../utils/propertyUtils.js";

let __BOARD_CACHE = null;

export async function fetchBoardNormalized() {
  if (__BOARD_CACHE) return __BOARD_CACHE;
  const rawBoard = await getBoard();
  let list = [];
  if (Array.isArray(rawBoard)) {
    list = rawBoard;
  } else if (rawBoard && (rawBoard.squares || rawBoard.casillas)) {
    list = rawBoard.squares || rawBoard.casillas || [];
  } else if (rawBoard && (rawBoard.bottom || rawBoard.left || rawBoard.top || rawBoard.right)) {
    const sides = ["bottom", "left", "top", "right"];
    for (const k of sides) {
      if (Array.isArray(rawBoard[k])) list = list.concat(rawBoard[k]);
    }
  }
  __BOARD_CACHE = list.map(normalizeBoardProperty).filter(Boolean);
  return __BOARD_CACHE;
}

export async function getPropertyById(id) {
  const board = await fetchBoardNormalized();
  return board.find(p => String(p.id) === String(id)) || null;
}

export async function getGroupProperties(prop) {
  if (!prop) return [];
  const board = await fetchBoardNormalized();
  const key = groupKeyFor(prop);
  if (!key) return [];
  if (prop.type === "property") {
    return board.filter(p => p.type === "property" && p.color === prop.color);
  }
  return board.filter(p => groupKeyFor(p) === key);
}

export async function countOwnedByType(ownerId, type) {
  const board = await fetchBoardNormalized();
  return board.filter(p => p.ownerId === ownerId && p.type === type).length;
}

/** Mutadores sobre el cache (solo para pruebas / front): asigna owner por id */
export function setOwnerInCacheById(id, ownerId) {
  if (!__BOARD_CACHE) return false;
  const idx = __BOARD_CACHE.findIndex(p => String(p.id) == String(id));
  if (idx === -1) return false;
  __BOARD_CACHE[idx] = { ...__BOARD_CACHE[idx], ownerId };
  return true;
}

/** Actualiza una propiedad completa en el cache */
export function updatePropertyInCache(property) {
  if (!__BOARD_CACHE || !property) return false;
  const idx = __BOARD_CACHE.findIndex(p => String(p.id) === String(property.id));
  if (idx === -1) return false;
  __BOARD_CACHE[idx] = { ...property.serialize() };
  return true;
}

/** Asigna owner a TODO el grupo de la propiedad dada (incluida ella) */
export async function setOwnerForGroup(prop, ownerId) {
  const group = await getGroupProperties(prop);
  let count = 0;
  for (const p of group) {
    const ok = setOwnerInCacheById(p.id, ownerId);
    if (ok) count++;
  }
  return count;
}

// === Servicios de construcción (casas/hotel) ===
// Requiere que la instancia 'property' sea de class Property (models/property.js)
// y que 'player' tenga payMoney(monto) o al menos un campo 'dinero' o 'money'.

export async function buildHouseService(property, player, { enforceEvenBuild = false } = {}) {
  if (!property || !player) return { ok: false, reason: "Faltan datos" };

  // Pasamos el dinero disponible para validar fondos
  const ownerMoney = typeof player.dinero === "number"
    ? player.dinero
    : (typeof player.money === "number" ? player.money : undefined);

  const res = await property.buildHouse(ownerMoney, { enforceEvenBuild });
  if (!res?.ok) return res;

  // Descontar saldo
  if (typeof player.payMoney === "function") {
    player.payMoney(res.price);
  } else if (typeof player.dinero === "number") {
    player.dinero -= res.price;
  } else if (typeof player.money === "number") {
    player.money -= res.price;
  }

  // Reflejar cambios en el cache del tablero
  updatePropertyInCache(property);
  return res;
}

export async function buildHotelService(property, player, { enforceEvenBuild = false } = {}) {
  if (!property || !player) return { ok: false, reason: "Faltan datos" };

  const ownerMoney = typeof player.dinero === "number"
    ? player.dinero
    : (typeof player.money === "number" ? player.money : undefined);

  const res = await property.buildHotel(ownerMoney, { enforceEvenBuild });
  if (!res?.ok) return res;

  if (typeof player.payMoney === "function") {
    player.payMoney(res.price);
  } else if (typeof player.dinero === "number") {
    player.dinero -= res.price;
  } else if (typeof player.money === "number") {
    player.money -= res.price;
  }

  updatePropertyInCache(property);
  return res;
}
