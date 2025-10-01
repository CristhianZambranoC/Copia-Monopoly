// utils/propertyUtils.js
export function normalizeBoardProperty(raw) {
  if (!raw) return null;
  const out = {
    id: raw.id ?? raw._id ?? null,
    name: raw.name ?? raw.nombre ?? raw.title ?? "",
    type: (raw.type ?? raw.tipo ?? "property").toLowerCase(),
    color: raw.color ?? raw.group ?? raw.grupoColor ?? null,
    price: Number(raw.price ?? raw.precio ?? 0),
    mortgage: Number(raw.mortgage ?? raw.hipoteca ?? 0),
    rent: {
      base: Number(raw.rent?.base ?? raw.rentaBase ?? raw.rentBase ?? 0),
      withHouse: [
        Number(raw.rent?.withHouse?.[0] ?? raw.rentasConCasas?.[0] ?? 0),
        Number(raw.rent?.withHouse?.[1] ?? raw.rentasConCasas?.[1] ?? 0),
        Number(raw.rent?.withHouse?.[2] ?? raw.rentasConCasas?.[2] ?? 0),
        Number(raw.rent?.withHouse?.[3] ?? raw.rentasConCasas?.[3] ?? 0),
      ],
      withHotel: Number(raw.rent?.withHotel ?? raw.rentaHotel ?? 0),
    },
    ownerId: raw.ownerId ?? null,
    houses: Number(raw.houses ?? 0),
    hotel: !!raw.hotel,
    isMortgaged: !!raw.isMortgaged,
  };
  return out;
}

export function groupKeyFor(prop) {
  if (!prop) return null;
  if (prop.type === "property") return prop.color || null;
  if (prop.type === "railroad") return "railroad";
  if (prop.type === "utility") return "utility";
  return null;
}

export function mortgageValue(prop) { return Number(prop?.mortgage || 0); }
export function unmortgageCost(prop) { const m = mortgageValue(prop); return Math.ceil(m * 1.10); }
export function buildCosts() { return { house: 100, hotel: 250 }; }

// utils/propertyUtils.js
// utils/propertyUtils.js
// utils/propertyUtils.js
export function canBuildOnProperty(
  prop,
  groupProps,
  ownerId,
  { forAction = "house", enforceEvenBuild = false } = {}
) {
  if (!prop || prop.type !== "property") return { ok: false, reason: "No edificable" };
  if (prop.ownerId !== ownerId) return { ok: false, reason: "No eres el propietario" };
  if (prop.isMortgaged) return { ok: false, reason: "La propiedad está hipotecada" };

  const ownsAll = Array.isArray(groupProps) && groupProps.length > 0 &&
    groupProps.every(p => p.ownerId === ownerId && !p.isMortgaged);
  if (!ownsAll) return { ok: false, reason: "No posees el grupo completo" };

  // (Opcional) modo clásico parejo
  if (enforceEvenBuild) {
    const counts = (groupProps || []).map(p => Number(p.houses || 0));
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    if (forAction === "house") {
      if (Number(prop.houses || 0) > min) return { ok: false, reason: "Debes construir parejo en el grupo (clásico)" };
      if (max - min > 1) return { ok: false, reason: "La diferencia de casas del grupo no puede ser > 1 (clásico)" };
    } else if (forAction === "hotel") {
      const allFour = (groupProps || []).every(p => Number(p.houses || 0) === 4);
      if (!allFour) return { ok: false, reason: "Para hotel (clásico) todas deben tener 4 casas" };
    }
  }

  if (forAction === "house") {
    if (prop.hotel) return { ok: false, reason: "Ya tiene hotel" };
    if (Number(prop.houses || 0) >= 4) return { ok: false, reason: "Máximo de casas alcanzado" };
  } else if (forAction === "hotel") {
    if (prop.hotel) return { ok: false, reason: "Ya tiene hotel" };
    if (Number(prop.houses || 0) < 4) return { ok: false, reason: "Necesitas 4 casas antes del hotel" };
  }

  return { ok: true };
}




export function rentForRailroads(ownedCount) {
  if (ownedCount <= 1) return 25;
  if (ownedCount === 2) return 50;
  if (ownedCount === 3) return 100;
  return 200;
}
export function rentForUtilities(diceRoll, ownedCount) {
  const roll = Number(diceRoll || 0);
  return ownedCount >= 2 ? roll * 10 : roll * 4;
}
export function rentForColorProperty(prop, groupProps, ownerId) {
  if (!prop || prop.type !== "property") return 0;
  const { rent } = prop;
  const houses = Number(prop.houses || 0);
  if (prop.hotel) return Number(rent.withHotel || 0);
  if (houses >= 1 && houses <= 4) return Number(rent.withHouse?.[houses - 1] || 0);
  const fullSet = (groupProps || []).every(p => p.ownerId === ownerId);
  const anyBuilt = (groupProps || []).some(p => (p.houses || 0) > 0 || p.hotel);
  if (fullSet && !anyBuilt) return Number(rent.base || 0) * 2;
  return Number(rent.base || 0);
}
export function calcRent(prop, context = {}) {
  if (!prop || prop.isMortgaged) return 0;
  if (prop.type === "railroad") {
    const owned = Number(context.railroadsOwnedByOwner || 0);
    return rentForRailroads(owned);
  }
  if (prop.type === "utility") {
    return rentForUtilities(context.diceRoll, Number(context.utilitiesOwnedByOwner || 0));
  }
  if (prop.type === "property") {
    return rentForColorProperty(prop, context.groupProps || [], prop.ownerId);
  }
  return 0;
}
