/**
 * Modelo de Casilla del Tablero de Monopoly
 */
import Square from './Square.js';
import { API_BASE } from '../utils/config.mjs';
/**
 * Modelo del Tablero de Monopoly
 */
class Board {
     constructor() {
        this.squares = new Map();           // Mapa de casillas por ID
        this.squaresByPosition = [];        // Array ordenado de casillas por posición
        this.propertiesByColor = new Map(); // Agrupación por color
        this.railroads = [];                // Lista de ferrocarriles
        this.specialSquares = new Map();    // Casillas especiales
        this.cardSquares = [];              // Casillas de cartas
        this.taxSquares = [];               // Casillas de impuestos
    }

    /**
     * Inicializa el tablero con los datos del backend
     */
    async initialize() {
        try {
            const response = await fetch(`${API_BASE}/board`);
            const boardData = await response.json();
            
            this.loadSquares(boardData);   // 🔹 Carga instancias de Square
            this.organizeSquares();        // 🔹 Las clasifica por tipo
            
            return true;
        } catch (error) {
            console.error('Error al cargar el tablero:', error);
            return false;
        }
    }

    /**
     * Carga todas las casillas desde los datos del backend
     */
    loadSquares(boardData) {
        // Limpiar arrays existentes
        this.squares.clear();
        this.squaresByPosition = [];
        
        const sides = ['bottom', 'left', 'top', 'right'];
        let position = 0;

        console.log('📦 Cargando casillas del backend...');
        
    // Cargar cartas del backend si están disponibles, sino fallback
    const rawChance = Array.isArray(boardData.chance) ? boardData.chance : null;
    const rawCommunity = Array.isArray(boardData.community_chest) ? boardData.community_chest : null;
    this.chanceCards = rawChance && rawChance.length ? rawChance : this.getFallbackChanceCards();
    this.communityCards = rawCommunity && rawCommunity.length ? rawCommunity : this.getFallbackCommunityCards();
        
        console.log(`🃏 Cartas de Suerte cargadas: ${this.chanceCards.length}`);
        console.log(`📦 Cartas de Caja de Comunidad cargadas: ${this.communityCards.length}`);
        
        // Debug: mostrar primera carta de cada tipo
        if (this.chanceCards.length > 0) {
            console.log('🎯 Primera carta de Suerte:', this.chanceCards[0]);
        }
        if (this.communityCards.length > 0) {
            console.log('🎯 Primera carta de Comunidad:', this.communityCards[0]);
        }
        
        // Mapear los datos incorrectos del backend al formato correcto del frontend
        const correctedData = this.correctBackendData(boardData);
        
        sides.forEach(side => {
            if (correctedData[side]) {
                console.log(`   ${side}: ${correctedData[side].length} casillas`);
                correctedData[side].forEach(squareData => {
                    // 🔹 Crear instancia de Square
                    const square = new Square(squareData);

                    // Guardar en estructuras
                    this.squares.set(square.id, square);
                    this.squaresByPosition[position] = square;
                    console.log(`     [${position}] ID:${square.id} - ${square.name}`);
                    position++;
                });
            } else {
                console.warn(`   ⚠️  Lado ${side} no encontrado en correctedData`);
            }
        });
        
        console.log(`✅ Total cargadas: ${position} casillas`);
        console.log(`🎯 squaresByPosition.length: ${this.squaresByPosition.length}`);
        console.log(`🎯 squares.size: ${this.squares.size}`);
        
        // Verificación final: asegurar que no hay huecos en el array
        for (let i = 0; i < 40; i++) {
            if (!this.squaresByPosition[i]) {
                console.error(`❌❌ HUECO EN ARRAY: posición ${i} está vacía`);
            }
        }
        
        console.log(`🎯 Verificación completada. Array real length: ${this.squaresByPosition.length}`);
    }

    /**
     * Corrige los datos del backend para que coincidan con el tablero estándar de Monopoly
     */
    correctBackendData(backendData) {
        // Datos corregidos basados en el JSON que proporcionaste
        const correctData = {
            "bottom": [
                { "id": 0, "name": "Salida", "type": "special", "action": { "money": 200 } },
                { "id": 1, "name": "Avenida Mediterráneo", "type": "property", "color": "brown", "price": 60, "mortgage": 30, "rent": { "base": 2, "withHouse": [10, 30, 90, 160], "withHotel": 250 } },
                { "id": 2, "name": "Caja de Comunidad", "type": "community_chest" },
                { "id": 3, "name": "Avenida Báltica", "type": "property", "color": "brown", "price": 60, "mortgage": 30, "rent": { "base": 4, "withHouse": [20, 60, 180, 320], "withHotel": 450 } },
                { "id": 4, "name": "Impuesto sobre ingresos", "type": "tax", "action": { "money": -200 } },
                { "id": 5, "name": "Ferrocarril Reading", "type": "railroad", "price": 200, "mortgage": 100, "rent": { "1": 25, "2": 50, "3": 100, "4": 200 } },
                { "id": 6, "name": "Avenida Oriental", "type": "property", "color": "purple", "price": 100, "mortgage": 50, "rent": { "base": 6, "withHouse": [30, 90, 270, 400], "withHotel": 550 } },
                { "id": 7, "name": "Sorpresa", "type": "chance" },
                { "id": 8, "name": "Avenida Vermont", "type": "property", "color": "purple", "price": 100, "mortgage": 50, "rent": { "base": 6, "withHouse": [30, 90, 270, 400], "withHotel": 550 } },
                { "id": 9, "name": "Avenida Connecticut", "type": "property", "color": "purple", "price": 120, "mortgage": 60, "rent": { "base": 8, "withHouse": [40, 100, 300, 450], "withHotel": 600 } }
            ],
            "left": [
                { "id": 10, "name": "Cárcel / Solo de visita", "type": "special" },
                { "id": 11, "name": "Plaza St. Charles", "type": "property", "color": "pink", "price": 140, "mortgage": 70, "rent": { "base": 10, "withHouse": [50, 150, 450, 625], "withHotel": 750 } },
                { "id": 12, "name": "Impuesto Electricidad", "type": "tax", "action": { "money": -50 } },
                { "id": 13, "name": "Avenida States", "type": "property", "color": "pink", "price": 140, "mortgage": 70, "rent": { "base": 10, "withHouse": [50, 150, 450, 625], "withHotel": 750 } },
                { "id": 14, "name": "Avenida Virginia", "type": "property", "color": "pink", "price": 160, "mortgage": 80, "rent": { "base": 12, "withHouse": [60, 180, 500, 700], "withHotel": 900 } },
                { "id": 15, "name": "Ferrocarril Pennsylvania", "type": "railroad", "price": 200, "mortgage": 100, "rent": { "1": 25, "2": 50, "3": 100, "4": 200 } },
                { "id": 16, "name": "Plaza St. James", "type": "property", "color": "orange", "price": 180, "mortgage": 90, "rent": { "base": 14, "withHouse": [70, 200, 550, 750], "withHotel": 950 } },
                { "id": 17, "name": "Caja de Comunidad", "type": "community_chest" },
                { "id": 18, "name": "Avenida Tennessee", "type": "property", "color": "orange", "price": 180, "mortgage": 90, "rent": { "base": 14, "withHouse": [70, 200, 550, 750], "withHotel": 950 } },
                { "id": 19, "name": "Avenida Nueva York", "type": "property", "color": "orange", "price": 200, "mortgage": 100, "rent": { "base": 16, "withHouse": [80, 220, 600, 800], "withHotel": 1000 } },
                { "id": 20, "name": "Parqueo Gratis", "type": "special" }
            ],
            "top": [
                { "id": 21, "name": "Avenida Kentucky", "type": "property", "color": "red", "price": 220, "mortgage": 110, "rent": { "base": 18, "withHouse": [90, 250, 700, 875], "withHotel": 1050 } },
                { "id": 22, "name": "Sorpresa", "type": "chance" },
                { "id": 23, "name": "Avenida Indiana", "type": "property", "color": "red", "price": 220, "mortgage": 110, "rent": { "base": 18, "withHouse": [90, 250, 700, 875], "withHotel": 1050 } },
                { "id": 24, "name": "Avenida Illinois", "type": "property", "color": "red", "price": 240, "mortgage": 120, "rent": { "base": 20, "withHouse": [100, 300, 750, 925], "withHotel": 1100 } },
                { "id": 25, "name": "Ferrocarril B&O", "type": "railroad", "price": 200, "mortgage": 100, "rent": { "1": 25, "2": 50, "3": 100, "4": 200 } },
                { "id": 26, "name": "Avenida Atlántico", "type": "property", "color": "yellow", "price": 260, "mortgage": 130, "rent": { "base": 22, "withHouse": [110, 330, 800, 975], "withHotel": 1150 } },
                { "id": 27, "name": "Avenida Ventnor", "type": "property", "color": "yellow", "price": 260, "mortgage": 130, "rent": { "base": 22, "withHouse": [110, 330, 800, 975], "withHotel": 1150 } },
                { "id": 28, "name": "Impuesto Agua", "type": "tax", "action": { "money": -50 } },
                { "id": 29, "name": "Jardines Marvin", "type": "property", "color": "yellow", "price": 280, "mortgage": 140, "rent": { "base": 24, "withHouse": [120, 360, 850, 1025], "withHotel": 1200 } },
                { "id": 30, "name": "Ve a la Cárcel", "type": "go_to_jail", "action": { "goTo": "jail" } }
            ],
            "right": [
                { "id": 31, "name": "Avenida Pacífico", "type": "property", "color": "green", "price": 300, "mortgage": 150, "rent": { "base": 26, "withHouse": [130, 390, 900, 1100], "withHotel": 1275 } },
                { "id": 32, "name": "Avenida Carolina del Norte", "type": "property", "color": "green", "price": 300, "mortgage": 150, "rent": { "base": 26, "withHouse": [130, 390, 900, 1100], "withHotel": 1275 } },
                { "id": 33, "name": "Caja de Comunidad", "type": "community_chest" },
                { "id": 34, "name": "Avenida Pensilvania", "type": "property", "color": "green", "price": 320, "mortgage": 160, "rent": { "base": 28, "withHouse": [150, 450, 1000, 1200], "withHotel": 1400 } },
                { "id": 35, "name": "Ferrocarril Short Line", "type": "railroad", "price": 200, "mortgage": 100, "rent": { "1": 25, "2": 50, "3": 100, "4": 200 } },
                { "id": 36, "name": "Sorpresa", "type": "chance" },
                { "id": 37, "name": "Avenida Parque", "type": "property", "color": "blue", "price": 350, "mortgage": 175, "rent": { "base": 35, "withHouse": [175, 500, 1100, 1300], "withHotel": 1500 } },
                { "id": 38, "name": "Impuesto de lujo", "type": "tax", "action": { "money": -100 } },
                { "id": 39, "name": "Paseo del Parque", "type": "property", "color": "blue", "price": 400, "mortgage": 200, "rent": { "base": 50, "withHouse": [200, 600, 1400, 1700], "withHotel": 2000 } }
            ]
        };

        console.log('🔧 Usando datos corregidos del tablero estándar Monopoly');
        return correctData;
    }

    /**
     * Organiza las casillas por tipo para acceso rápido
     */
    organizeSquares() {
        this.squares.forEach(square => {
            if (square.isProperty() && square.color) {
                if (!this.propertiesByColor.has(square.color)) {
                    this.propertiesByColor.set(square.color, []);
                }
                this.propertiesByColor.get(square.color).push(square);
            }

            if (square.isRailroad()) {
                this.railroads.push(square);
            }

            if (square.isSpecial()) {
                this.specialSquares.set(square.name.toLowerCase(), square);
            }

            if (square.isCard()) {
                this.cardSquares.push(square);
            }

            if (square.isTax()) {
                this.taxSquares.push(square);
            }
        });
    }

    /**
     * Obtiene una casilla por su ID
     */
    getSquare(id) {
        return this.squares.get(id);
    }


    /**
     * Obtiene una casilla por su posición en el tablero
     */
    getSquareByPosition(position) {
        return this.squaresByPosition[position % this.getTotalSquares()];
    }

    /**
     * Obtiene el número total de casillas
     */
    getTotalSquares() {
        return this.squaresByPosition.length;
    }

    /**
     * Obtiene todas las propiedades de un color específico
     */
    getPropertiesByColor(color) {
        return this.propertiesByColor.get(color) || [];
    }

    /**
     * Verifica si un jugador tiene el monopolio de un color
     */
    hasMonopoly(playerId, color) {
        const properties = this.getPropertiesByColor(color);
        return properties.length > 0 && 
               properties.every(property => property.owner === playerId);
    }

    /**
     * Obtiene todos los ferrocarriles de un jugador
     */
    getPlayerRailroads(playerId) {
        return this.railroads.filter(railroad => railroad.owner === playerId);
    }

    /**
     * Obtiene la renta de un ferrocarril según cuántos tenga el dueño
     */
    getRailroadRent(railroadId, playerId) {
        const railroad = this.getSquare(railroadId);
        if (!railroad || !railroad.isRailroad() || railroad.owner !== playerId) {
            return 0;
        }

        const playerRailroads = this.getPlayerRailroads(playerId);
        const count = playerRailroads.length;
        
        return railroad.rent[count.toString()] || 0;
    }

    /**
     * Calcula el valor total de las propiedades de un jugador
     */
    getPlayerTotalValue(playerId) {
        let total = 0;
        
        this.squares.forEach(square => {
            if (square.owner === playerId) {
                total += square.getTotalValue();
            }
        });

        return total;
    }

    /**
     * Obtiene todas las propiedades de un jugador
     */
    getPlayerProperties(playerId) {
        const properties = [];
        
        this.squares.forEach(square => {
            if (square.owner === playerId && 
                (square.isProperty() || square.isRailroad())) {
                properties.push(square);
            }
        });

        return properties;
    }

    /**
     * Verifica si una propiedad puede ser construida (tiene monopolio)
     */
    canBuildOnProperty(propertyId, playerId) {
        const property = this.getSquare(propertyId);
        if (!property || !property.isProperty() || property.owner !== playerId) {
            return false;
        }

        return this.hasMonopoly(playerId, property.color) && property.canBuild();
    }

    /**
     * Resetea el tablero a su estado inicial
     */
    reset() {
        this.squares.forEach(square => square.reset());
    }

    /**
     * Obtiene información del tablero para renderizado
     */
    getBoardLayout() {
        return {
            totalSquares: this.getTotalSquares(),
            squares: Array.from(this.squares.values()),
            squaresByPosition: this.squaresByPosition,
            propertiesByColor: Object.fromEntries(this.propertiesByColor),
            railroads: this.railroads,
            specialSquares: Object.fromEntries(this.specialSquares)
        };
    }

    /**
     * Cartas de Suerte de fallback desde el JSON proporcionado
     */
    getFallbackChanceCards() {
        return [
            {
                "id": 1,
                "description": "Recibe $150 por ganar la lotería",
                "type": "chance",
                "action": {
                    "money": 150
                }
            },
            {
                "id": 2,
                "description": "Paga $75 por multa de tráfico",
                "type": "chance",
                "action": {
                    "money": -75
                }
            },
            {
                "id": 3,
                "description": "Recibe $100 por devolución de impuestos",
                "type": "chance",
                "action": {
                    "money": 100
                }
            },
            {
                "id": 4,
                "description": "Paga $150 por gastos legales",
                "type": "chance",
                "action": {
                    "money": -150
                }
            },
            {
                "id": 5,
                "description": "Recibe $50 por un premio sorpresa",
                "type": "chance",
                "action": {
                    "money": 50
                }
            }
        ];
    }

    /**
     * Cartas de Caja de Comunidad de fallback desde el JSON proporcionado
     */
    getFallbackCommunityCards() {
        return [
            {
                "id": 1,
                "description": "Recibe $100 por venta de acciones",
                "type": "community_chest",
                "action": {
                    "money": 100
                }
            },
            {
                "id": 2,
                "description": "Paga $50 por gastos médicos",
                "type": "community_chest",
                "action": {
                    "money": -50
                }
            },
            {
                "id": 3,
                "description": "Recibe $200 por herencia",
                "type": "community_chest",
                "action": {
                    "money": 200
                }
            },
            {
                "id": 4,
                "description": "Paga $100 por reparación de propiedades",
                "type": "community_chest",
                "action": {
                    "money": -100
                }
            },
            {
                "id": 5,
                "description": "Recibe $50 de reembolso de impuestos",
                "type": "community_chest",
                "action": {
                    "money": 50
                }
            }
        ];
    }
}

// Exportar las clases para uso en otros archivos
export default Board;
