// models/property.js
import { calcRent, canBuildOnProperty, buildCosts, mortgageValue, unmortgageCost } from "../utils/propertyUtils.js";
import { getGroupProperties, countOwnedByType } from "../controllers/property.service.js";

export class Property {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.name = data.name ?? "";
    this.type = (data.type ?? "property").toLowerCase();
    this.color = data.color ?? null;
    this.price = Number(data.price ?? 0);
    this.mortgage = Number(data.mortgage ?? 0);
    this.rent = data.rent ?? { base: 0, withHouse: [0, 0, 0, 0], withHotel: 0 };

    this.ownerId = data.ownerId ?? null;
    this.houses = Number(data.houses ?? 0);
    this.hotel = !!data.hotel;
    this.isMortgaged = !!data.isMortgaged;
  }

  // ===== MÉTODOS DE CONSULTA DE ESTADO =====

  /** Verifica si la propiedad está libre (sin dueño) */
  isFree() {
    return this.ownerId === null || this.ownerId === undefined;
  }

  /** Verifica si la propiedad pertenece al jugador dado */
  isOwnedBy(playerId) {
    return this.ownerId === playerId;
  }

  /** Verifica si la propiedad pertenece a otro jugador */
  isOwnedByOther(playerId) {
    return !this.isFree() && !this.isOwnedBy(playerId);
  }

  /** Verifica si la propiedad está disponible para comprar */
  canBeBoughtBy(playerId) {
    return this.isFree() && !this.isMortgaged;
  }

  /** Verifica si el jugador debe pagar renta */
  shouldPayRent(playerId) {
    return this.isOwnedByOther(playerId) && !this.isMortgaged;
  }

  /** Obtiene el estado de la propiedad para un jugador específico */
  getStatusFor(playerId) {
    if (this.isFree()) return "free";
    if (this.isOwnedBy(playerId)) {
      return this.isMortgaged ? "owned_mortgaged" : "owned";
    }
    return this.isMortgaged ? "other_mortgaged" : "other_owned";
  }

  // ===== MÉTODOS DE OWNERSHIP =====

  setOwner(ownerId) {
    this.ownerId = ownerId ?? null;
  }

  clearOwner() {
    this.ownerId = null;
    this.houses = 0;
    this.hotel = false;
    this.isMortgaged = false;
  }

  /** Intenta comprar la propiedad para un jugador */
  attemptPurchase(playerId, playerMoney) {
    if (!this.canBeBoughtBy(playerId)) {
      return {
        ok: false,
        reason: this.isFree() ? "La propiedad está hipotecada" : "La propiedad ya tiene dueño",
        cost: this.price
      };
    }

    if ((Number(playerMoney) || 0) < this.price) {
      return {
        ok: false,
        reason: "Dinero insuficiente",
        cost: this.price
      };
    }

    this.setOwner(playerId);
    return {
      ok: true,
      cost: this.price,
      message: `Propiedad ${this.name} comprada por ${playerId}`
    };
  }

  // ===== MÉTODOS DE HIPOTECA =====

  applyMortgage() {
    if (this.isMortgaged) return { ok: false, reason: "Ya está hipotecada" };
    if (this.houses > 0 || this.hotel) return { ok: false, reason: "Vende edificaciones antes de hipotecar" };
    this.isMortgaged = true;
    return { ok: true, amount: mortgageValue(this) };
  }

  // Alias para mantener compatibilidad
  mortgage() {
    return this.applyMortgage();
  }

  removeMortgage(currentMoney) {
    if (!this.isMortgaged) return { ok: false, reason: "No está hipotecada" };
    const cost = unmortgageCost(this);
    if ((Number(currentMoney) || 0) < cost) return { ok: false, reason: "Dinero insuficiente", cost };
    this.isMortgaged = false;
    return { ok: true, cost };
  }

  // Alias para mantener compatibilidad
  unmortgage(currentMoney) {
    return this.removeMortgage(currentMoney);
  }

  // ===== MÉTODOS DE CONSTRUCCIÓN =====

  // models/property.js (dentro de class Property)

  async canBuild(ownerId, { enforceEvenBuild = false, forAction = "house" } = {}) {
    const groupProps = await getGroupProperties(this);
    return canBuildOnProperty(this, groupProps, ownerId, { enforceEvenBuild, forAction });
  }
  
  async buildHouse(ownerMoney, { enforceEvenBuild = false } = {}) {
    // Validación por acción
    const check = await this.canBuild(this.ownerId, { enforceEvenBuild, forAction: "house" });
    if (!check || !check.ok) return check;
  
    // Costo
    const costs = buildCosts();               // -> { house: 100, hotel: 250 }
    const price = Number(costs.house || 0);
  
    // Validar fondos si me pasas el dinero del dueño
    if (typeof ownerMoney === "number" && ownerMoney < price) {
      return { ok: false, reason: "Fondos insuficientes", needed: price };
    }
  
    // Aplicar efecto
    this.houses = Number(this.houses || 0) + 1;
  
    // Responder con precio para que el servicio descuente
    return {
      ok: true,
      action: "house",
      price,
      houses: this.houses,
      hotel: !!this.hotel
    };
  }
  
  async buildHotel(ownerMoney, { enforceEvenBuild = false } = {}) {
    // Validación por acción (ya NO choca con 'máximo de casas')
    const check = await this.canBuild(this.ownerId, { enforceEvenBuild, forAction: "hotel" });
    if (!check || !check.ok) return check;
  
    // Costo
    const costs = buildCosts();               // -> { house: 100, hotel: 250 }
    const price = Number(costs.hotel || 0);
  
    // Validar fondos si me pasas el dinero del dueño
    if (typeof ownerMoney === "number" && ownerMoney < price) {
      return { ok: false, reason: "Fondos insuficientes", needed: price };
    }
  
    // Aplicar efecto: hotel activo y casas a 0 (reemplaza 4 casas)
    this.hotel = true;
    this.houses = 0;
  
    // Responder con precio para que el servicio descuente
    return {
      ok: true,
      action: "hotel",
      price,
      houses: this.houses,  // 0
      hotel: !!this.hotel   // true
    };
  }

  sellHouse() {
    if (this.houses <= 0) return { ok: false, reason: "No hay casas para vender" };
    this.houses -= 1;
    const refund = Math.floor(buildCosts().house / 2);
    return { ok: true, refund, houses: this.houses };
  }

  sellHotel() {
    if (!this.hotel) return { ok: false, reason: "No hay hotel para vender" };
    this.hotel = false;
    this.houses = 4;
    const refund = Math.floor(buildCosts().hotel / 2);
    return { ok: true, refund, houses: this.houses };
  }

  // ===== MÉTODOS DE RENTA =====

  async calculateRent({ diceRoll, forPlayer } = {}) {
    if (this.isMortgaged) return 0;

    // Si se especifica un jugador, verificar si debe pagar
    if (forPlayer && !this.shouldPayRent(forPlayer)) {
      return 0;
    }

    if (this.type === "railroad") {
      const owned = await countOwnedByType(this.ownerId, "railroad");
      return calcRent(this, { railroadsOwnedByOwner: owned });
    }
    if (this.type === "utility") {
      const owned = await countOwnedByType(this.ownerId, "utility");
      return calcRent(this, { diceRoll, utilitiesOwnedByOwner: owned });
    }
    if (this.type === "property") {
      const groupProps = await getGroupProperties(this);
      return calcRent(this, { groupProps });
    }
    return 0;
  }

  /** Procesa el pago de renta por parte de un jugador */
  async processRentPayment(payingPlayer, { diceRoll } = {}) {
    if (!this.shouldPayRent(payingPlayer.nickname || payingPlayer.id)) {
      return { ok: true, amount: 0, reason: "No debe pagar renta" };
    }

    const rentAmount = await this.calculateRent({
      diceRoll,
      forPlayer: payingPlayer.nickname || payingPlayer.id
    });

    if (rentAmount === 0) {
      return { ok: true, amount: 0, reason: "Renta es $0" };
    }

    const playerMoney = Number(payingPlayer.dinero || payingPlayer.money || 0);
    if (playerMoney < rentAmount) {
      return {
        ok: false,
        amount: rentAmount,
        reason: "Dinero insuficiente para pagar renta",
        deficit: rentAmount - playerMoney
      };
    }

    return {
      ok: true,
      amount: rentAmount,
      owner: this.ownerId,
      message: `${payingPlayer.nickname} paga $${rentAmount} a ${this.ownerId} por ${this.name}`
    };
  }

  // ===== SERIALIZACIÓN =====

  serialize() {
    return {
      id: this.id, name: this.name, type: this.type, color: this.color,
      price: this.price, mortgage: this.mortgage, rent: this.rent,
      ownerId: this.ownerId, houses: this.houses, hotel: this.hotel, isMortgaged: this.isMortgaged,

      // Estados calculados (útiles para debugging)
      status: {
        isFree: this.isFree(),
        isMortgaged: this.isMortgaged,
        hasBuildings: this.houses > 0 || this.hotel
      }
    };
  }

  // ===== MÉTODOS DE INFORMACIÓN =====

  /** Obtiene información detallada de la propiedad para un jugador */
  async getInfoFor(playerId) {
    const status = this.getStatusFor(playerId);
    const rent = await this.calculateRent({ forPlayer: playerId });

    return {
      ...this.serialize(),
      statusForPlayer: status,
      currentRent: rent,
      canBuy: this.canBeBoughtBy(playerId),
      shouldPayRent: this.shouldPayRent(playerId)
    };
  }
}