class BoardUtils {
    /**
     * Calcula la distribución de casillas por lado del tablero
     */
    static calculateSquareDistribution(totalSquares) {
        if (totalSquares < 4) {
            throw new Error('El tablero debe tener al menos 4 casillas (esquinas)');
        }

        const perSide = Math.floor(totalSquares / 4);
        const remainder = totalSquares % 4;
        
        return {
            bottom: perSide + (remainder > 0 ? 1 : 0),
            left: perSide + (remainder > 1 ? 1 : 0),
            top: perSide + (remainder > 2 ? 1 : 0),
            right: perSide,
            total: totalSquares
        };
    }

    /**
     * Obtiene plantillas de casillas según el idioma
     */
    static getSquareTemplates(language = 'es') {
        const templates = {
            es: {
                corners: [
                    { name: "Salida", type: "special", action: { money: 200 } },
                    { name: "Cárcel / Solo de visita", type: "special" },
                    { name: "Parqueo Gratis", type: "special" },
                    { name: "Ve a la Cárcel", type: "special", action: { goTo: "jail" } }
                ],
                properties: [
                    // Grupo marrón
                    { name: "Avenida Mediterráneo", color: "brown", price: 60, mortgage: 30, rent: { base: 2, withHouse: [10, 30, 90, 160], withHotel: 250 } },
                    { name: "Avenida Báltica", color: "brown", price: 60, mortgage: 30, rent: { base: 4, withHouse: [20, 60, 180, 320], withHotel: 450 } },
                    // Grupo púrpura
                    { name: "Avenida Oriental", color: "purple", price: 100, mortgage: 50, rent: { base: 6, withHouse: [30, 90, 270, 400], withHotel: 550 } },
                    { name: "Avenida Vermont", color: "purple", price: 100, mortgage: 50, rent: { base: 6, withHouse: [30, 90, 270, 400], withHotel: 550 } },
                    { name: "Avenida Connecticut", color: "purple", price: 120, mortgage: 60, rent: { base: 8, withHouse: [40, 100, 300, 450], withHotel: 600 } },
                    // Grupo rosado
                    { name: "Plaza St. Charles", color: "pink", price: 140, mortgage: 70, rent: { base: 10, withHouse: [50, 150, 450, 625], withHotel: 750 } },
                    { name: "Avenida States", color: "pink", price: 140, mortgage: 70, rent: { base: 10, withHouse: [50, 150, 450, 625], withHotel: 750 } },
                    { name: "Avenida Virginia", color: "pink", price: 160, mortgage: 80, rent: { base: 12, withHouse: [60, 180, 500, 700], withHotel: 900 } },
                    // Grupo naranja
                    { name: "Plaza St. James", color: "orange", price: 180, mortgage: 90, rent: { base: 14, withHouse: [70, 200, 550, 750], withHotel: 950 } },
                    { name: "Avenida Tennessee", color: "orange", price: 180, mortgage: 90, rent: { base: 14, withHouse: [70, 200, 550, 750], withHotel: 950 } },
                    { name: "Avenida Nueva York", color: "orange", price: 200, mortgage: 100, rent: { base: 16, withHouse: [80, 220, 600, 800], withHotel: 1000 } },
                    // Grupo rojo
                    { name: "Avenida Kentucky", color: "red", price: 220, mortgage: 110, rent: { base: 18, withHouse: [90, 250, 700, 875], withHotel: 1050 } },
                    { name: "Avenida Indiana", color: "red", price: 220, mortgage: 110, rent: { base: 18, withHouse: [90, 250, 700, 875], withHotel: 1050 } },
                    { name: "Avenida Illinois", color: "red", price: 240, mortgage: 120, rent: { base: 20, withHouse: [100, 300, 750, 925], withHotel: 1100 } },
                    // Grupo amarillo
                    { name: "Avenida Atlántico", color: "yellow", price: 260, mortgage: 130, rent: { base: 22, withHouse: [110, 330, 800, 975], withHotel: 1150 } },
                    { name: "Avenida Ventnor", color: "yellow", price: 260, mortgage: 130, rent: { base: 22, withHouse: [110, 330, 800, 975], withHotel: 1150 } },
                    { name: "Jardines Marvin", color: "yellow", price: 280, mortgage: 140, rent: { base: 24, withHouse: [120, 360, 850, 1025], withHotel: 1200 } },
                    // Grupo verde
                    { name: "Avenida Pacífico", color: "green", price: 300, mortgage: 150, rent: { base: 26, withHouse: [130, 390, 900, 1100], withHotel: 1275 } },
                    { name: "Avenida Carolina del Norte", color: "green", price: 300, mortgage: 150, rent: { base: 26, withHouse: [130, 390, 900, 1100], withHotel: 1275 } },
                    { name: "Avenida Pensilvania", color: "green", price: 320, mortgage: 160, rent: { base: 28, withHouse: [150, 450, 1000, 1200], withHotel: 1400 } },
                    // Grupo azul
                    { name: "Avenida Parque", color: "blue", price: 350, mortgage: 175, rent: { base: 35, withHouse: [175, 500, 1100, 1300], withHotel: 1500 } },
                    { name: "Paseo del Parque", color: "blue", price: 400, mortgage: 200, rent: { base: 50, withHouse: [200, 600, 1400, 1700], withHotel: 2000 } }
                ],
                railroads: [
                    { name: "Ferrocarril Reading", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } },
                    { name: "Ferrocarril Pennsylvania", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } },
                    { name: "Ferrocarril B&O", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } },
                    { name: "Ferrocarril Short Line", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } }
                ],
                taxes: [
                    { name: "Impuesto sobre ingresos", type: "tax", action: { money: -200 } },
                    { name: "Impuesto Electricidad", type: "tax", action: { money: -50 } },
                    { name: "Impuesto Agua", type: "tax", action: { money: -50 } },
                    { name: "Impuesto de lujo", type: "tax", action: { money: -100 } }
                ],
                cards: [
                    { name: "Caja de Comunidad", type: "community_chest" },
                    { name: "Sorpresa", type: "chance" }
                ]
            },
            en: {
                corners: [
                    { name: "GO", type: "special", action: { money: 200 } },
                    { name: "Jail / Just Visiting", type: "special" },
                    { name: "Free Parking", type: "special" },
                    { name: "Go to Jail", type: "special", action: { goTo: "jail" } }
                ],
                properties: [
                    { name: "Mediterranean Avenue", color: "brown", price: 60, mortgage: 30, rent: { base: 2, withHouse: [10, 30, 90, 160], withHotel: 250 } },
                    { name: "Baltic Avenue", color: "brown", price: 60, mortgage: 30, rent: { base: 4, withHouse: [20, 60, 180, 320], withHotel: 450 } },
                    { name: "Oriental Avenue", color: "purple", price: 100, mortgage: 50, rent: { base: 6, withHouse: [30, 90, 270, 400], withHotel: 550 } },
                    { name: "Vermont Avenue", color: "purple", price: 100, mortgage: 50, rent: { base: 6, withHouse: [30, 90, 270, 400], withHotel: 550 } },
                    { name: "Connecticut Avenue", color: "purple", price: 120, mortgage: 60, rent: { base: 8, withHouse: [40, 100, 300, 450], withHotel: 600 } }
                ],
                railroads: [
                    { name: "Reading Railroad", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } },
                    { name: "Pennsylvania Railroad", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } },
                    { name: "B&O Railroad", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } },
                    { name: "Short Line", price: 200, mortgage: 100, rent: { "1": 25, "2": 50, "3": 100, "4": 200 } }
                ],
                taxes: [
                    { name: "Income Tax", type: "tax", action: { money: -200 } },
                    { name: "Electric Company", type: "tax", action: { money: -50 } },
                    { name: "Water Works", type: "tax", action: { money: -50 } },
                    { name: "Luxury Tax", type: "tax", action: { money: -100 } }
                ],
                cards: [
                    { name: "Community Chest", type: "community_chest" },
                    { name: "Chance", type: "chance" }
                ]
            }
        };

        return templates[language] || templates.es;
    }

    /**
     * Genera datos de prueba para el tablero con el número especificado de casillas
     */
    static generateTestBoardData(totalSquares, language = 'es') {
        const distribution = this.calculateSquareDistribution(totalSquares);
        const boardData = {
            bottom: [],
            left: [],
            top: [],
            right: []
        };

        const templates = this.getSquareTemplates(language);
        let squareId = 0;

        // Índices para las plantillas
        let propertyIndex = 0;
        let railroadIndex = 0;
        let taxIndex = 0;
        let cardIndex = 0;

        // Generar casillas para cada lado
        Object.keys(distribution).forEach(side => {
            if (side === 'total') return;
            
            const sideCount = distribution[side];
            for (let i = 0; i < sideCount; i++) {
                const isCorner = (side === 'bottom' && i === 0) ||
                               (side === 'left' && i === 0) ||
                               (side === 'top' && i === 0) ||
                               (side === 'right' && i === 0);

                let square;

                if (isCorner) {
                    // Asignar esquinas específicas
                    let cornerIndex;
                    if (side === 'bottom' && i === 0) cornerIndex = 0; // Salida
                    else if (side === 'left' && i === 0) cornerIndex = 1; // Cárcel
                    else if (side === 'top' && i === 0) cornerIndex = 2; // Parqueo Gratis
                    else if (side === 'right' && i === 0) cornerIndex = 3; // Ve a la Cárcel

                    square = {
                        id: squareId,
                        ...templates.corners[cornerIndex]
                    };
                } else {
                    // Determinar tipo de casilla basado en posición y disponibilidad
                    const squareType = this.determineSquareType(squareId, totalSquares, i, sideCount);
                    
                    switch (squareType) {
                        case 'property':
                            if (propertyIndex < templates.properties.length) {
                                square = {
                                    id: squareId,
                                    type: 'property',
                                    ...templates.properties[propertyIndex]
                                };
                                propertyIndex++;
                            } else {
                                // Generar propiedad aleatoria si se agotan las plantillas
                                square = this.generateRandomProperty(squareId, language);
                            }
                            break;

                        case 'railroad':
                            if (railroadIndex < templates.railroads.length) {
                                square = {
                                    id: squareId,
                                    type: 'railroad',
                                    ...templates.railroads[railroadIndex]
                                };
                                railroadIndex++;
                            } else {
                                square = this.generateRandomRailroad(squareId, railroadIndex, language);
                                railroadIndex++;
                            }
                            break;

                        case 'tax':
                            if (taxIndex < templates.taxes.length) {
                                square = {
                                    id: squareId,
                                    ...templates.taxes[taxIndex]
                                };
                                taxIndex++;
                            } else {
                                square = this.generateRandomTax(squareId, language);
                            }
                            break;

                        case 'card':
                            const cardTemplate = templates.cards[cardIndex % templates.cards.length];
                            square = {
                                id: squareId,
                                ...cardTemplate
                            };
                            cardIndex++;
                            break;

                        default:
                            // Casilla por defecto
                            square = {
                                id: squareId,
                                name: `Casilla ${squareId}`,
                                type: 'special'
                            };
                    }
                }

                boardData[side].push(square);
                squareId++;
            }
        });

        return boardData;
    }

    /**
     * Determina el tipo de casilla basado en su posición
     */
    static determineSquareType(squareId, totalSquares, positionInSide, sideCount) {
        // Patrón básico para distribución de tipos
        const patterns = {
            small: ['property', 'card', 'property', 'tax'], // Para tableros pequeños
            medium: ['property', 'property', 'card', 'property', 'railroad', 'property', 'tax'], // Tableros medianos
            large: ['property', 'property', 'card', 'property', 'property', 'railroad', 'property', 'card', 'property', 'tax'] // Tableros grandes
        };

        let pattern;
        if (totalSquares <= 16) pattern = patterns.small;
        else if (totalSquares <= 32) pattern = patterns.medium;
        else pattern = patterns.large;

        return pattern[squareId % pattern.length];
    }

    /**
     * Genera una propiedad aleatoria
     */
    static generateRandomProperty(id, language) {
        const colors = ['brown', 'purple', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];
        const color = colors[id % colors.length];
        const basePrice = 100 + (id * 20);

        const names = {
            es: [`Avenida Test ${id}`, `Calle Prueba ${id}`, `Plaza Virtual ${id}`],
            en: [`Test Avenue ${id}`, `Sample Street ${id}`, `Virtual Plaza ${id}`]
        };

        return {
            id: id,
            name: names[language] ? names[language][id % 3] : names.es[id % 3],
            type: 'property',
            color: color,
            price: basePrice,
            mortgage: Math.floor(basePrice / 2),
            rent: {
                base: Math.floor(basePrice * 0.1),
                withHouse: [
                    Math.floor(basePrice * 0.3),
                    Math.floor(basePrice * 0.9),
                    Math.floor(basePrice * 2.7),
                    Math.floor(basePrice * 4.0)
                ],
                withHotel: Math.floor(basePrice * 5.5)
            }
        };
    }

    /**
     * Genera un ferrocarril aleatorio
     */
    static generateRandomRailroad(id, index, language) {
        const names = {
            es: [`Ferrocarril Norte ${index + 1}`, `Ferrocarril Sur ${index + 1}`, `Ferrocarril Este ${index + 1}`, `Ferrocarril Oeste ${index + 1}`],
            en: [`North Railroad ${index + 1}`, `South Railroad ${index + 1}`, `East Railroad ${index + 1}`, `West Railroad ${index + 1}`]
        };

        return {
            id: id,
            name: names[language] ? names[language][index % 4] : names.es[index % 4],
            type: 'railroad',
            price: 200,
            mortgage: 100,
            rent: {
                "1": 25,
                "2": 50,
                "3": 100,
                "4": 200
            }
        };
    }

    /**
     * Genera un impuesto aleatorio
     */
    static generateRandomTax(id, language) {
        const taxes = {
            es: [
                { name: "Impuesto Municipal", money: -100 },
                { name: "Impuesto Predial", money: -75 },
                { name: "Impuesto Vehicular", money: -50 },
                { name: "Impuesto de Renta", money: -150 }
            ],
            en: [
                { name: "Municipal Tax", money: -100 },
                { name: "Property Tax", money: -75 },
                { name: "Vehicle Tax", money: -50 },
                { name: "Income Tax", money: -150 }
            ]
        };

        const taxList = taxes[language] || taxes.es;
        const selectedTax = taxList[id % taxList.length];

        return {
            id: id,
            name: selectedTax.name,
            type: 'tax',
            action: {
                money: selectedTax.money
            }
        };
    }

    /**
     * Valida la estructura del tablero generado
     */
    static validateBoardData(boardData) {
        const sides = ['bottom', 'left', 'top', 'right'];
        let totalSquares = 0;
        let hasCorners = 0;

        for (const side of sides) {
            if (!Array.isArray(boardData[side])) {
                return { valid: false, error: `Lado ${side} no es un array` };
            }

            totalSquares += boardData[side].length;

            // Verificar que el primer elemento de cada lado sea una esquina
            if (boardData[side].length > 0 && boardData[side][0].type === 'special') {
                hasCorners++;
            }
        }

        if (hasCorners !== 4) {
            return { valid: false, error: 'Faltan esquinas en el tablero' };
        }

        if (totalSquares < 4) {
            return { valid: false, error: 'El tablero debe tener al menos 4 casillas' };
        }

        return { valid: true, totalSquares };
    }
}

// Ejemplo de uso:
/*
// Generar tablero de prueba de 40 casillas
const testBoard = BoardUtils.generateTestBoardData(40, 'es');
console.log('Tablero generado:', testBoard);

// Validar el tablero
const validation = BoardUtils.validateBoardData(testBoard);
if (validation.valid) {
    console.log(`Tablero válido con ${validation.totalSquares} casillas`);
} else {
    console.error('Error en el tablero:', validation.error);
}

// Generar tablero más pequeño
const smallBoard = BoardUtils.generateTestBoardData(12, 'en');
console.log('Tablero pequeño:', smallBoard);
*/

export default BoardUtils;