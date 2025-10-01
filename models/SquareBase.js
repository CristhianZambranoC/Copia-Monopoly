class Square {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.color = data.color || null;
        this.price = data.price || 0;
        this.mortgage = data.mortgage || 0;
        this.rent = data.rent || null;
        this.action = data.action || null;
        
        // Estados dinámicos de la casilla
        this.owner = null;
        this.houses = 0;
        this.hasHotel = false;
        this.isMortgaged = false;
    }

    /**
     * Verifica si la casilla es una propiedad
     */
    isProperty() {
        return this.type === 'property';
    }

    /**
     * Verifica si la casilla es un ferrocarril
     */
    isRailroad() {
        return this.type === 'railroad';
    }

    /**
     * Verifica si la casilla es una utilidad (aunque no aparece en el JSON actual)
     */
    isUtility() {
        return this.type === 'utility';
    }

    /**
     * Verifica si la casilla es especial (Salida, Cárcel, etc.)
     */
    isSpecial() {
        return this.type === 'special';
    }

    /**
     * Verifica si la casilla es de cartas (Sorpresa o Caja de Comunidad)
     */
    isCard() {
        return this.type === 'chance' || this.type === 'community_chest';
    }

    /**
     * Verifica si la casilla es de impuestos
     */
    isTax() {
        return this.type === 'tax';
    }

    /**
     * Obtiene la renta actual de la propiedad según su estado
     */
    getCurrentRent() {
        if (!this.isProperty() && !this.isRailroad()) return 0;
        if (this.isMortgaged) return 0;

        if (this.isProperty()) {
            if (this.hasHotel) {
                return this.rent.withHotel;
            } else if (this.houses > 0) {
                return this.rent.withHouse[this.houses - 1];
            } else {
                return this.rent.base;
            }
        }

        if (this.isRailroad()) {
            // La renta del ferrocarril depende de cuántos ferrocarriles tenga el dueño
            // Esto se calculará en la lógica del juego
            return this.rent;
        }

        return 0;
    }

    /**
     * Verifica si se puede construir en esta propiedad
     */
    canBuild() {
        return this.isProperty() && 
               this.owner !== null && 
               !this.isMortgaged && 
               !this.hasHotel && 
               this.houses < 4;
    }

    /**
     * Verifica si se puede construir un hotel
     */
    canBuildHotel() {
        return this.isProperty() && 
               this.owner !== null && 
               !this.isMortgaged && 
               this.houses === 4 && 
               !this.hasHotel;
    }

    /**
     * Agrega una casa a la propiedad
     */
    addHouse() {
        if (this.canBuild()) {
            this.houses++;
            return true;
        }
        return false;
    }

    /**
     * Construye un hotel (reemplaza las 4 casas)
     */
    buildHotel() {
        if (this.canBuildHotel()) {
            this.houses = 0;
            this.hasHotel = true;
            return true;
        }
        return false;
    }

    /**
     * Hipoteca la propiedad
     */
    mortgageProperty() {
        if ((this.isProperty() || this.isRailroad()) && 
            this.owner !== null && 
            !this.isMortgaged &&
            this.houses === 0 && 
            !this.hasHotel) {
            this.isMortgaged = true;
            return this.mortgage;
        }
        return 0;
    }

    /**
     * Deshipoteca la propiedad (incluye el 10% de interés)
     */
    unmortgageProperty() {
        if (this.isMortgaged) {
            this.isMortgaged = false;
            return Math.floor(this.mortgage * 1.1); // 10% de interés
        }
        return 0;
    }

    /**
     * Obtiene el valor total de la propiedad (para cálculo final)
     */
    getTotalValue() {
        if (!this.isProperty() && !this.isRailroad()) return 0;
        if (this.isMortgaged) return -this.mortgage; // Deuda por hipoteca

        let value = this.price;
        
        if (this.isProperty()) {
            value += this.houses * 100; // Cada casa vale 100
            if (this.hasHotel) {
                value += 200; // Hotel vale 200 adicionales (según PDF)
            }
        }

        return value;
    }

    /**
     * Resetea la casilla a su estado inicial
     */
    reset() {
        this.owner = null;
        this.houses = 0;
        this.hasHotel = false;
        this.isMortgaged = false;
    }

    
}
export default Square;

