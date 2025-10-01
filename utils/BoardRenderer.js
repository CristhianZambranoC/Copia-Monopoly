/**
 * Renderizador dinámico del tablero de Monopoly
 * Maneja la creación visual del tablero con soporte para múltiples idiomas y tamaños variables
 */
class BoardRenderer {
    constructor(containerSelector, board, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.board = board;
        this.options = {
            totalSquares: options.totalSquares || 40,
            language: options.language || 'es',
            boardSize: options.boardSize || 800,
            cornerSize: options.cornerSize || 120,
            sideSquareWidth: options.sideSquareWidth || 80,
            sideSquareHeight: options.sideSquareHeight || 120,
            ...options
        };
        
        this.translations = new Map();
        this.players = new Map(); // Para trackear posiciones de jugadores
        this.boardElement = null;
        
        // Inicializar traducciones por defecto
        this.initializeDefaultTranslations();
    }

    /**
     * Inicializa las traducciones por defecto
     */
    initializeDefaultTranslations() {
        this.translations.set('es', {
            available: 'Disponible',
            owned: 'Propiedad de',
            mortgaged: 'Hipotecada',
            houses: 'Casas',
            hotel: 'Hotel',
            price: 'Precio',
            rent: 'Renta',
            go: 'Salida',
            jail: 'Cárcel',
            parking: 'Parking Gratuito',
            goToJail: 'Ve a la Cárcel',
            chance: 'Sorpresa',
            communityChest: 'Caja de Comunidad',
            tax: 'Impuesto'
        });

        this.translations.set('en', {
            available: 'Available',
            owned: 'Owned by',
            mortgaged: 'Mortgaged',
            houses: 'Houses',
            hotel: 'Hotel',
            price: 'Price',
            rent: 'Rent',
            go: 'Go',
            jail: 'Jail',
            parking: 'Free Parking',
            goToJail: 'Go to Jail',
            chance: 'Chance',
            communityChest: 'Community Chest',
            tax: 'Tax'
        });
    }

    /**
     * Carga traducciones desde una API externa
     */
    async loadTranslations(apiUrl, language) {
        try {
            const response = await fetch(`${apiUrl}/${language}`);
            const translations = await response.json();
            this.translations.set(language, translations);
            this.options.language = language;
            return true;
        } catch (error) {
            console.warn('Error loading translations:', error);
            return false;
        }
    }

    /**
     * Obtiene una traducción para el idioma actual
     */
    t(key, fallback = key) {
        const currentTranslations = this.translations.get(this.options.language);
        return currentTranslations ? currentTranslations[key] || fallback : fallback;
    }

    /**
     * Calcula las dimensiones del tablero dinámicamente
     */
    calculateDimensions() {
        const { totalSquares, cornerSize, sideSquareWidth, sideSquareHeight } = this.options;

        // Caso especial: tablero clásico de 40 casillas
        if (totalSquares === 40) {
            const betweenCorners = 9;  // 9 casillas entre esquinas por lado
            const boardWidth = cornerSize * 2 + betweenCorners * sideSquareWidth;
            const boardHeight = boardWidth;
            return {
                boardWidth,
                boardHeight,
                // Tablero clásico: cada lado tiene exactamente 10 casillas (incluye esquinas compartidas conceptualmente)
                sides: { bottom: 10, left: 10, top: 10, right: 10 },
                squaresPerSide: 10
            };
        }

        // Fallback genérico para otros tamaños dinámicos
        const squaresPerSide = Math.floor((totalSquares - 4) / 4);
        const remainingSquares = (totalSquares - 4) % 4;
        const sides = {
            bottom: squaresPerSide + (remainingSquares > 0 ? 1 : 0),
            left: squaresPerSide + (remainingSquares > 1 ? 1 : 0),
            top: squaresPerSide + (remainingSquares > 2 ? 1 : 0),
            right: squaresPerSide
        };
        const maxSideSquares = Math.max(...Object.values(sides));
        const boardWidth = cornerSize * 2 + maxSideSquares * sideSquareWidth;
        const boardHeight = boardWidth;
        return { boardWidth, boardHeight, sides, squaresPerSide: maxSideSquares };
    }

    /**
     * Crea la estructura HTML base del tablero
     */
    createBoardStructure() {
        const dimensions = this.calculateDimensions();
        
        this.container.innerHTML = '';
        this.container.className = 'monopoly-board-container';
        
        this.boardElement = document.createElement('div');
        this.boardElement.className = 'monopoly-board';
        this.boardElement.style.cssText = `
            width: ${dimensions.boardWidth}px;
            height: ${dimensions.boardHeight}px;
            position: relative;
            background: #c8e6c9;
            border: 3px solid #2e7d32;
            box-sizing: border-box;
        `;

        // Crear el área central del tablero
        const centerArea = document.createElement('div');
        centerArea.className = 'board-center';
        centerArea.style.cssText = `
            position: absolute;
            top: ${this.options.cornerSize}px;
            left: ${this.options.cornerSize}px;
            width: ${dimensions.boardWidth - this.options.cornerSize * 2}px;
            height: ${dimensions.boardHeight - this.options.cornerSize * 2}px;
            background: linear-gradient(135deg, #f1f8e9, #dcedc1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Arial', sans-serif;
            font-size: 24px;
            font-weight: bold;
            color: #2e7d32;
            text-align: center;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
        `;
        centerArea.innerHTML = `
            <div>
                <div style="font-size: 32px; margin-bottom: 10px;">MONOPOLY</div>
                <div style="font-size: 16px; opacity: 0.8;">Dynamic Board</div>
                <div style="font-size: 14px; margin-top: 5px;">${this.options.totalSquares} ${this.t('squares', 'squares')}</div>
            </div>
        `;

        this.boardElement.appendChild(centerArea);
        this.container.appendChild(this.boardElement);

        return dimensions;
    }

    /**
     * Crea una casilla individual
     */
    createSquare(square, position, side, index, dimensions) {
        const squareElement = document.createElement('div');
        squareElement.className = `square square-${side} square-${square.type}`;
        squareElement.setAttribute('data-square-id', square.id);
        squareElement.setAttribute('data-position', position);

        // Calcular posición y tamaño
        let pos;
        // Detectar tablero de 40 casillas y usar cálculo clásico simplificado
        const totalSquares = this.board.squaresByPosition ? this.board.squaresByPosition.length : this.options.totalSquares;
        const isClassic40 = totalSquares === 40;

        if (isClassic40) {
            // Para tablero clásico usar posicionamiento simplificado basado en índice relativo por lado
            pos = this.calculateClassic40Position(side, index, position, dimensions);
        } else {
            pos = this.calculateSquarePosition(side, index, dimensions);
        }
        
        squareElement.style.cssText = `
            position: absolute;
            left: ${pos.x}px;
            top: ${pos.y}px;
            width: ${pos.width}px;
            height: ${pos.height}px;
            background: white;
            border: 2px solid #333;
            box-sizing: border-box;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            font-family: 'Arial', sans-serif;
            font-size: ${pos.fontSize}px;
        `;

        // Agregar contenido de la casilla
        this.populateSquareContent(squareElement, square, pos);

        // Agregar eventos
        squareElement.addEventListener('click', () => this.onSquareClick(square, position));
        squareElement.addEventListener('mouseenter', () => this.onSquareHover(square, squareElement));
        squareElement.addEventListener('mouseleave', () => this.onSquareLeave(square, squareElement));

        return squareElement;
    }

    /**
     * Calcula la posición de una casilla según su lado e índice
     */
    calculateSquarePosition(side, index, dimensions) {
        const { cornerSize, sideSquareWidth, sideSquareHeight } = this.options;
        const { boardWidth, boardHeight, squaresPerSide } = dimensions;

        let x, y, width, height, fontSize = 10;
        const lastIndex = squaresPerSide - 1; // Para tablero clásico: 9

        const isCorner = (i) => i === 0 || i === lastIndex;

        switch (side) {
            case 'bottom':
                if (isCorner(index)) {
                    // 0 = esquina inferior derecha, lastIndex = esquina inferior izquierda
                    x = index === 0 ? boardWidth - cornerSize : 0;
                    y = boardHeight - cornerSize;
                    width = cornerSize;
                    height = cornerSize;
                    fontSize = 12;
                } else {
                    // Casillas intermedias de derecha a izquierda
                    x = boardWidth - cornerSize - (index * sideSquareWidth);
                    y = boardHeight - sideSquareHeight;
                    width = sideSquareWidth;
                    height = sideSquareHeight;
                }
                break;

            case 'left':
                if (isCorner(index)) {
                    // 0 = esquina inferior izquierda, lastIndex = esquina superior izquierda
                    x = 0;
                    y = index === 0 ? boardHeight - cornerSize : 0;
                    width = cornerSize;
                    height = cornerSize;
                    fontSize = 12;
                } else {
                    // Casillas intermedias de abajo hacia arriba
                    y = boardHeight - cornerSize - (index * sideSquareWidth);
                    x = 0;
                    width = sideSquareHeight;
                    height = sideSquareWidth;
                }
                break;

            case 'top':
                if (isCorner(index)) {
                    // 0 = esquina superior izquierda, lastIndex = esquina superior derecha
                    x = index === 0 ? 0 : boardWidth - cornerSize;
                    y = 0;
                    width = cornerSize;
                    height = cornerSize;
                    fontSize = 12;
                } else {
                    // Casillas intermedias de izquierda a derecha
                    x = cornerSize + ((index - 1) * sideSquareWidth);
                    y = 0;
                    width = sideSquareWidth;
                    height = sideSquareHeight;
                }
                break;

            case 'right':
                if (isCorner(index)) {
                    // 0 = esquina superior derecha, lastIndex = esquina inferior derecha
                    x = boardWidth - cornerSize;
                    y = index === 0 ? 0 : boardHeight - cornerSize;
                    width = cornerSize;
                    height = cornerSize;
                    fontSize = 12;
                } else {
                    // Casillas intermedias de arriba hacia abajo
                    x = boardWidth - sideSquareHeight;
                    y = cornerSize + ((index - 1) * sideSquareWidth);
                    width = sideSquareHeight;
                    height = sideSquareWidth;
                }
                break;
        }

        return { x, y, width, height, fontSize };
    }

    /**
     * Llena el contenido de una casilla
     */
    populateSquareContent(element, square, position) {
        element.innerHTML = '';

        // Header con color para propiedades
        if (square.isProperty() && square.color) {
            const colorHeader = document.createElement('div');
            colorHeader.className = 'property-color';
            colorHeader.style.cssText = `
                background: ${square.color};
                height: 25%;
                width: 100%;
                border-bottom: 1px solid #333;
            `;
            element.appendChild(colorHeader);
        }

        // Contenido principal
        const content = document.createElement('div');
        content.className = 'square-content';
        content.style.cssText = `
            padding: 4px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            overflow: hidden;
        `;

        // Nombre de la casilla
        const name = document.createElement('div');
        name.className = 'square-name';
        name.style.cssText = `
            font-weight: bold;
            font-size: ${Math.min(position.fontSize, 11)}px;
            line-height: 1.1;
            margin-bottom: 2px;
            word-wrap: break-word;
        `;
        name.textContent = square.name;
        content.appendChild(name);

        // Información adicional según el tipo
        if (square.isProperty() || square.isRailroad()) {
            // Precio
            if (square.price) {
                const price = document.createElement('div');
                price.className = 'square-price';
                price.style.cssText = `
                    font-size: ${Math.min(position.fontSize - 1, 9)}px;
                    color: #666;
                    margin: 1px 0;
                `;
                price.textContent = `$${square.price}`;
                content.appendChild(price);
            }

            // Estado de propiedad
            const status = document.createElement('div');
            status.className = 'property-status';
            status.style.cssText = `
                font-size: ${Math.min(position.fontSize - 2, 8)}px;
                padding: 2px;
                border-radius: 3px;
                margin-top: auto;
            `;
            this.updatePropertyStatus(status, square);
            content.appendChild(status);
        }

        element.appendChild(content);

        // Área para fichas de jugadores
        const playersArea = document.createElement('div');
        playersArea.className = 'players-area';
        playersArea.style.cssText = `
            position: absolute;
            bottom: 2px;
            right: 2px;
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
        `;
        element.appendChild(playersArea);
    }

    /**
     * Actualiza el estado visual de una propiedad
     */
    updatePropertyStatus(statusElement, square) {
        let statusText = this.t('available');
        let statusColor = '#e8f5e8';
        let textColor = '#666';

        if (square.owner) {
            statusText = this.t('owned');
            statusColor = '#ffecb3';
            textColor = '#f57c00';
        }

        if (square.isMortgaged) {
            statusText = this.t('mortgaged');
            statusColor = '#ffcdd2';
            textColor = '#d32f2f';
        }

        statusElement.textContent = statusText;
        statusElement.style.background = statusColor;
        statusElement.style.color = textColor;
    }

    /**
     * Renderiza el tablero completo
     */
    async render() {
        const dimensions = this.createBoardStructure();
        
        if (!this.board || !this.board.squaresByPosition) {
            console.error('Board data not available');
            return;
        }

        // Detectar tablero de 40 casillas (clásico) por longitud del array o método
        const totalSquares = this.board.squaresByPosition.length;
        console.log(`🎲 Renderizando tablero con ${totalSquares} casillas`);

        // Forzar renderizado de tablero clásico si hay 40 casillas
        if (totalSquares === 40) {
            console.log('🔧 Renderizando tablero clásico de 40 casillas...');
            let renderedCount = 0;
            
            // Renderizar TODAS las 40 casillas sin excepción
            for (let globalIndex = 0; globalIndex < 40; globalIndex++) {
                const square = this.board.squaresByPosition[globalIndex];
                
                if (!square) {
                    console.error(`❌ CASILLA FALTANTE en índice ${globalIndex}`);
                    continue;
                }
                
                // Determinar el lado basado en el índice global según el JSON del backend
                let side, relativeIndex;
                if (globalIndex >= 0 && globalIndex <= 9) {
                    side = 'bottom';
                    relativeIndex = globalIndex;
                } else if (globalIndex >= 10 && globalIndex <= 20) {
                    side = 'left';
                    relativeIndex = globalIndex - 10;
                } else if (globalIndex >= 21 && globalIndex <= 30) {
                    side = 'top';
                    relativeIndex = globalIndex - 21;
                } else if (globalIndex >= 31 && globalIndex <= 39) {
                    side = 'right';
                    relativeIndex = globalIndex - 31;
                } else {
                    console.error(`❌ Índice fuera de rango: ${globalIndex}`);
                    continue;
                }
                
                try {
                    const squareElement = this.createSquare(square, globalIndex, side, relativeIndex, dimensions);
                    
                    // Debug temporal: añadir ID visible
                    const debugSpan = document.createElement('span');
                    debugSpan.style.cssText = 'position:absolute;top:2px;right:2px;background:red;color:white;font-size:8px;padding:1px 3px;z-index:100;border-radius:2px;';
                    debugSpan.textContent = square.id;
                    squareElement.appendChild(debugSpan);
                    
                    this.boardElement.appendChild(squareElement);
                    renderedCount++;
                    
                    if (globalIndex % 10 === 0) {
                        console.log(`   ✓ Procesado hasta índice ${globalIndex}: ID${square.id} - ${square.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Error renderizando casilla ${globalIndex}:`, error);
                }
            }
            
            console.log(`✅ TOTAL RENDERIZADAS: ${renderedCount}/40 casillas`);
            
            if (renderedCount !== 40) {
                console.error(`❌❌ PROBLEMA: Se renderizaron ${renderedCount} en lugar de 40`);
                // Mostrar detalles de las que faltan
                for (let i = 0; i < 40; i++) {
                    if (!this.board.squaresByPosition[i]) {
                        console.error(`   - FALTA casilla índice ${i}`);
                    }
                }
            }
            
        } else {
            // Fallback para tableros dinámicos
            console.log('📐 Usando renderizado dinámico');
            const { sides } = dimensions;
            let position = 0;
            const sideNames = ['bottom', 'left', 'top', 'right'];
            sideNames.forEach(sideName => {
                const squareCount = sides[sideName];
                for (let i = 0; i < squareCount && position < this.board.squaresByPosition.length; i++) {
                    const square = this.board.squaresByPosition[position];
                    if (square) {
                        const squareElement = this.createSquare(square, position, sideName, i, dimensions);
                        this.boardElement.appendChild(squareElement);
                    }
                    position++;
                }
            });
        }

        // Agregar estilos CSS dinámicos
        this.injectDynamicStyles();
    }

    /**
     * Determina el lado (bottom, left, top, right) según el índice global en tablero clásico
     */
    getClassic40Side(index) {
        if (index >= 0 && index <= 9) return 'bottom';      // 0..9 (solo esquina en 0)
        if (index >= 10 && index <= 20) return 'left';      // 10..20 (esquinas 10 y 20)
        if (index >= 21 && index <= 30) return 'top';       // 21..30 (esquina 30)
        return 'right';                                     // 31..39
    }

    /**
     * Calcula posición absoluta para un tablero clásico de 40 casillas usando índice global.
     * Respeta la estructura real del JSON (longitudes: bottom 10, left 11, top 10, right 9).
     */
    calculateClassic40Position(side, relativeIndex, globalIndex, dimensions) {
        const { cornerSize, sideSquareWidth, sideSquareHeight } = this.options;
        const { boardWidth, boardHeight } = dimensions;
        let x, y, width, height, fontSize = 10;

        // Esquinas fijas del tablero Monopoly
        if (globalIndex === 0) { // Salida (esquina inferior derecha)
            return { x: boardWidth - cornerSize, y: boardHeight - cornerSize, width: cornerSize, height: cornerSize, fontSize: 12 };
        }
        if (globalIndex === 10) { // Cárcel (esquina inferior izquierda)  
            return { x: 0, y: boardHeight - cornerSize, width: cornerSize, height: cornerSize, fontSize: 12 };
        }
        if (globalIndex === 20) { // Parqueo Gratis (esquina superior izquierda)
            return { x: 0, y: 0, width: cornerSize, height: cornerSize, fontSize: 12 };
        }
        if (globalIndex === 30) { // Ve a la Cárcel (esquina superior derecha)
            return { x: boardWidth - cornerSize, y: 0, width: cornerSize, height: cornerSize, fontSize: 12 };
        }

        // Casillas del lado inferior (1-9): de derecha a izquierda
        if (globalIndex >= 1 && globalIndex <= 9) {
            x = boardWidth - cornerSize - (relativeIndex * sideSquareWidth);
            y = boardHeight - sideSquareHeight;
            width = sideSquareWidth;
            height = sideSquareHeight;
        }
        // Casillas del lado izquierdo (11-19): de abajo hacia arriba  
        else if (globalIndex >= 11 && globalIndex <= 19) {
            x = 0;
            y = boardHeight - cornerSize - (relativeIndex * sideSquareWidth);
            width = sideSquareHeight;
            height = sideSquareWidth;
        }
        // Casillas del lado superior (21-29): de izquierda a derecha
        else if (globalIndex >= 21 && globalIndex <= 29) {
            x = cornerSize + ((relativeIndex) * sideSquareWidth);
            y = 0;
            width = sideSquareWidth;
            height = sideSquareHeight;
        }
        // Casillas del lado derecho (31-39): de arriba hacia abajo
        else if (globalIndex >= 31 && globalIndex <= 39) {
            x = boardWidth - sideSquareHeight;
            y = cornerSize + ((relativeIndex) * sideSquareWidth);
            width = sideSquareHeight;
            height = sideSquareWidth;
        }
        // Fallback (no debería ocurrir)
        else {
            console.error(`❌ Error de posicionamiento para casilla ${globalIndex}`);
            x = 0; y = 0; width = sideSquareWidth; height = sideSquareHeight;
        }

        return { x, y, width, height, fontSize };
    }

    /**
     * Inyecta estilos CSS dinámicos
     */
    injectDynamicStyles() {
        const styleId = 'monopoly-dynamic-styles';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            .monopoly-board-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 20px auto;
                background: #f5f5f5;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }

            .square:hover {
                transform: scale(1.05);
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .square-special {
                background: linear-gradient(135deg, #fff3e0, #ffe0b2) !important;
            }

            .square-property {
                background: linear-gradient(135deg, #ffffff, #f8f9fa) !important;
            }

            .square-railroad {
                background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
            }

            .square-chance, .square-community_chest {
                background: linear-gradient(135deg, #fce4ec, #f8bbd9) !important;
            }

            .square-tax {
                background: linear-gradient(135deg, #fff8e1, #ffecb3) !important;
            }

            .player-piece {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 1px solid #333;
                display: inline-block;
            }

            .property-buildings {
                position: absolute;
                top: 2px;
                left: 2px;
                display: flex;
                gap: 1px;
            }

            .house {
                width: 6px;
                height: 6px;
                background: #4caf50;
                border-radius: 1px;
            }

            .hotel {
                width: 8px;
                height: 6px;
                background: #f44336;
                border-radius: 1px;
            }

            @media (max-width: 768px) {
                .monopoly-board-container {
                    padding: 10px;
                    margin: 10px;
                }
                
                .board-center {
                    font-size: 18px !important;
                }
            }
        `;
    }

    /**
     * Actualiza el idioma del tablero
     */
    async updateLanguage(language, translationApiUrl = null) {
        if (translationApiUrl) {
            await this.loadTranslations(translationApiUrl, language);
        } else {
            this.options.language = language;
        }
        
        // Re-renderizar el tablero con el nuevo idioma
        await this.render();
    }

    /**
     * Actualiza el tamaño del tablero
     */
    async updateBoardSize(totalSquares) {
        this.options.totalSquares = totalSquares;
        await this.render();
    }

    /**
     * Agrega un jugador al tablero
     */
    addPlayer(playerId, playerData) {
        this.players.set(playerId, {
            ...playerData,
            position: 0
        });
    }

    /**
     * Mueve un jugador a una posición
     */
    movePlayer(playerId, newPosition) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Remover ficha de posición anterior
        this.removePlayerPieceFromPosition(playerId, player.position);
        
        // Actualizar posición
        player.position = newPosition % this.options.totalSquares;
        this.players.set(playerId, player);

        // Agregar ficha en nueva posición
        this.addPlayerPieceToPosition(playerId, player.position, player.color);
    }

    /**
     * Remueve la ficha de un jugador de una posición
     */
    removePlayerPieceFromPosition(playerId, position) {
        const square = document.querySelector(`[data-position="${position}"] .players-area`);
        if (square) {
            const piece = square.querySelector(`[data-player-id="${playerId}"]`);
            if (piece) {
                piece.remove();
            }
        }
    }

    /**
     * Agrega la ficha de un jugador a una posición
     */
    addPlayerPieceToPosition(playerId, position, color) {
        const square = document.querySelector(`[data-position="${position}"] .players-area`);
        if (square) {
            const piece = document.createElement('div');
            piece.className = 'player-piece';
            piece.setAttribute('data-player-id', playerId);
            piece.style.background = color;
            piece.title = `Player ${playerId}`;
            square.appendChild(piece);
        }
    }

    /**
     * Actualiza el estado de una casilla
     */
    updateSquare(squareId, newState) {
        const square = this.board.getSquare(squareId);
        if (!square) return;

        // Actualizar datos del square
        Object.assign(square, newState);

        // Actualizar visualmente
        const squareElement = document.querySelector(`[data-square-id="${squareId}"]`);
        if (squareElement) {
            const statusElement = squareElement.querySelector('.property-status');
            if (statusElement) {
                this.updatePropertyStatus(statusElement, square);
            }

            // Actualizar construcciones
            this.updateSquareBuildings(squareElement, square);
        }
    }

    /**
     * Actualiza las construcciones en una casilla
     */
    updateSquareBuildings(squareElement, square) {
        // Remover construcciones existentes
        const existingBuildings = squareElement.querySelector('.property-buildings');
        if (existingBuildings) {
            existingBuildings.remove();
        }

        if (square.houses > 0 || square.hasHotel) {
            const buildings = document.createElement('div');
            buildings.className = 'property-buildings';
            buildings.style.cssText = `
                position: absolute;
                top: 2px;
                left: 2px;
                display: flex;
                gap: 1px;
                z-index: 5;
            `;

            if (square.hasHotel) {
                const hotel = document.createElement('div');
                hotel.className = 'hotel';
                buildings.appendChild(hotel);
            } else {
                for (let i = 0; i < square.houses; i++) {
                    const house = document.createElement('div');
                    house.className = 'house';
                    buildings.appendChild(house);
                }
            }

            squareElement.appendChild(buildings);
        }
    }

    /**
     * Eventos de interacción con casillas
     */
    onSquareClick(square, position) {
        console.log('Square clicked:', square.name, 'Position:', position);
        // Emitir evento personalizado
        const event = new CustomEvent('squareClick', {
            detail: { square, position }
        });
        this.container.dispatchEvent(event);
    }

    onSquareHover(square, element) {
        // Evitar duplicados
        const previo = document.querySelector('.square-tooltip');
        if (previo) previo.remove();

        const tooltip = this.createTooltip(square);
        document.body.appendChild(tooltip);

        const posicionar = (clientX, clientY) => {
            const rect = element.getBoundingClientRect();
            // Posición base: debajo de la casilla
            let left = rect.left + window.scrollX + rect.width / 2 + 8;
            let top = rect.top + window.scrollY + rect.height + 8; // debajo

            // Si el mouse está muy abajo/arriba usamos su posición como guía
            if (clientX !== undefined && clientY !== undefined) {
                left = clientX + 14;
                top = clientY + 14;
            }

            // Ajustes para que no se salga de la pantalla
            const tw = tooltip.offsetWidth;
            const th = tooltip.offsetHeight;
            const vw = window.innerWidth + window.scrollX;
            const vh = window.innerHeight + window.scrollY;

            if (left + tw + 8 > vw) left = vw - tw - 8;
            if (top + th + 8 > vh) top = rect.top + window.scrollY - th - 8; // colocar arriba si no cabe abajo
            if (top < window.scrollY) top = window.scrollY + 8; // mínimo visible
            if (left < window.scrollX) left = window.scrollX + 8;

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        };

        // Inicial
        posicionar();
        let lastMove = 0;
        const moveHandler = (e) => {
            // Throttle ligero
            const now = performance.now();
            if (now - lastMove < 16) return; // ~60fps
            lastMove = now;
            posicionar(e.clientX + window.scrollX, e.clientY + window.scrollY);
        };
        element.addEventListener('mousemove', moveHandler);
        element.addEventListener('mouseleave', () => {
            element.removeEventListener('mousemove', moveHandler);
        }, { once: true });
    }

    onSquareLeave(square, element) {
        // Remover tooltip
        const tooltip = document.querySelector('.square-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Crea un tooltip informativo para una casilla
     */
    createTooltip(square) {
        const tooltip = document.createElement('div');
        tooltip.className = 'square-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: #0f172a;
            color: #f1f5f9;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            line-height: 1.35;
            box-shadow: 0 6px 16px -4px rgba(0,0,0,.4),0 2px 6px -2px rgba(0,0,0,.3);
            max-width: 220px;
            z-index: 1000;
            pointer-events: none;
            border:1px solid #1e293b;
            backdrop-filter: blur(2px);
            transform-origin: top left;
            animation: fadeInTooltip .18s ease;
        `;

        // Animación CSS (solo se define una vez si no existe)
        if (!document.getElementById('tooltip-keyframes')) {
            const style = document.createElement('style');
            style.id = 'tooltip-keyframes';
            style.textContent = `@keyframes fadeInTooltip{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`;
            document.head.appendChild(style);
        }

        const fmtMoney = (v) => (v || v === 0) ? `$${v}` : '-';
        let content = `<strong style="font-size:13px;">${square.name}</strong>`;

        if (square.isProperty() || square.isRailroad()) {
            content += `<div style="margin-top:4px;">Precio: <strong>${fmtMoney(square.price)}</strong></div>`;
            if (square.color) {
                content += `<div>Color: <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${square.color};vertical-align:middle;margin-right:4px;"></span>${square.color}</div>`;
            }
            if (square.owner) {
                content += `<div>Dueño: <strong>${square.owner}</strong></div>`;
            } else {
                content += `<div style="color:#38bdf8;">Libre</div>`;
            }
            if (square.isMortgaged) {
                content += `<div style="color:#f87171;">Hipotecada</div>`;
            }

            // Detalles de renta si es propiedad estándar
            if (square.isProperty() && square.rent) {
                const r = square.rent;
                const actual = square.getCurrentRent ? square.getCurrentRent() : r.base;
                content += `<hr style="border:none;border-top:1px solid #1e293b;margin:6px 0;"/>`;
                content += `<div style="font-weight:600;margin-bottom:3px;">Rentas</div>`;
                content += `<div style="display:flex;justify-content:space-between;">Base <span>${fmtMoney(r.base)}</span></div>`;
                if (Array.isArray(r.withHouse)) {
                    r.withHouse.forEach((val, idx) => {
                        content += `<div style="display:flex;justify-content:space-between;">${idx+1} casa${idx? 's':''} <span>${fmtMoney(val)}</span></div>`;
                    });
                }
                if (r.withHotel !== undefined) {
                    content += `<div style="display:flex;justify-content:space-between;">Hotel <span>${fmtMoney(r.withHotel)}</span></div>`;
                }
                content += `<div style="margin-top:4px;">Renta actual: <strong>${fmtMoney(actual)}</strong></div>`;
                if (square.houses>0) {
                    content += `<div>Casas construidas: ${square.houses}</div>`;
                }
                if (square.hasHotel) {
                    content += `<div>Hotel construido</div>`;
                }
            }

            // Ferrocarril (mostrar renta base y nota)
            if (square.isRailroad()) {
                const renta = square.getCurrentRent ? square.getCurrentRent() : square.rent;
                content += `<div>Renta base: <strong>${fmtMoney(renta)}</strong></div>`;
                content += `<div style="font-size:11px;color:#94a3b8;">(Aumenta según ferrocarriles del dueño)</div>`;
            }
        } else if (square.isTax && square.isTax()) {
            content += `<div>Tipo: Impuesto</div>`;
        } else if (square.isCard && square.isCard()) {
            content += `<div>Casilla de cartas</div>`;
        }

        tooltip.innerHTML = content;
        return tooltip;
    }

    /**
     * Destruye el renderizador y limpia eventos
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        const styleElement = document.getElementById('monopoly-dynamic-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }
}

export default BoardRenderer;