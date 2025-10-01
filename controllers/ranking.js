/**
 * Servicio para manejo del ranking de jugadores
 * Incluye funciones para obtener y mostrar el ranking desde el backend
 */
        let rankingData = [];

        /**
         * Carga el ranking desde el API
         */
        async function cargarRanking() {
            mostrarLoading();
            
            try {
                console.log('🔄 Cargando ranking desde el API...');
                
                const { API_BASE } = await import('../utils/config.mjs');
                const response = await fetch(`${API_BASE}/ranking`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Ranking cargado exitosamente:', data);
                
                rankingData = Array.isArray(data) ? data : [];
                mostrarRanking(rankingData);
                
            } catch (error) {
                console.error('❌ Error al cargar ranking:', error);
                mostrarError(error.message);
            }
        }

        /**
         * Muestra el estado de loading
         */
        function mostrarLoading() {
            document.getElementById('loadingSpinner').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('rankingTable').style.display = 'none';
            document.getElementById('emptyMessage').style.display = 'none';
            document.getElementById('statsContainer').style.display = 'none';
        }

        /**
         * Muestra mensaje de error
         */
        function mostrarError(mensaje) {
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('rankingTable').style.display = 'none';
            document.getElementById('emptyMessage').style.display = 'none';
            document.getElementById('statsContainer').style.display = 'none';
            
            document.getElementById('errorDetails').textContent = mensaje;
        }

        /**
         * Muestra el ranking en la tabla
         */
        function mostrarRanking(data) {
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
            
            if (!data || data.length === 0) {
                document.getElementById('emptyMessage').style.display = 'block';
                document.getElementById('rankingTable').style.display = 'none';
                document.getElementById('statsContainer').style.display = 'none';
                return;
            }

            // Mostrar estadísticas
            mostrarEstadisticas(data);
            
            // Mostrar tabla
            document.getElementById('rankingTable').style.display = 'block';
            document.getElementById('emptyMessage').style.display = 'none';
            
            const tbody = document.getElementById('rankingTableBody');
            tbody.innerHTML = '';

            data.forEach((jugador, index) => {
                const position = index + 1;
                const row = crearFilaRanking(jugador, position);
                tbody.appendChild(row);
            });
        }

        /**
         * Crea una fila de la tabla de ranking
         */
        function crearFilaRanking(jugador, position) {
            const row = document.createElement('tr');
            row.className = 'ranking-row';

            // Columna de posición
            const positionCell = document.createElement('td');
            positionCell.className = `ranking-position position-${position <= 3 ? position : ''}`;
            
            let emoji = '';
            if (position === 1) emoji = '🥇';
            else if (position === 2) emoji = '🥈';
            else if (position === 3) emoji = '🥉';
            else emoji = position;
            
            positionCell.textContent = emoji;

            // Columna de jugador
            const playerCell = document.createElement('td');
            playerCell.innerHTML = `
                <div class="player-info">
                    <strong>${jugador.nick_name || 'Jugador Anónimo'}</strong>
                </div>
            `;

            // Columna de país con bandera
            const countryCell = document.createElement('td');
            countryCell.className = 'text-center';
            const countryCode = jugador.country_code || 'co';
            countryCell.innerHTML = `
                <div class="player-info justify-content-center">
                    <img src="https://flagsapi.com/${countryCode.toUpperCase()}/flat/32.png" 
                         alt="${countryCode}" class="flag-img" 
                         onerror="this.src='https://flagsapi.com/CO/flat/32.png'">
                    <span>${countryCode.toUpperCase()}</span>
                </div>
            `;

            // Columna de puntaje
            const scoreCell = document.createElement('td');
            scoreCell.className = 'text-end';
            scoreCell.innerHTML = `<span class="score-badge">${jugador.score?.toLocaleString() || '0'}</span>`;

            row.appendChild(positionCell);
            row.appendChild(playerCell);
            row.appendChild(countryCell);
            row.appendChild(scoreCell);

            return row;
        }

        /**
         * Muestra estadísticas generales
         */
        function mostrarEstadisticas(data) {
            const totalPlayers = data.length;
            const highestScore = Math.max(...data.map(j => j.score || 0));
            const countries = [...new Set(data.map(j => j.country_code || 'co'))];
            const totalCountries = countries.length;

            document.getElementById('totalPlayers').textContent = totalPlayers;
            document.getElementById('highestScore').textContent = highestScore.toLocaleString();
            document.getElementById('totalCountries').textContent = totalCountries;
            document.getElementById('statsContainer').style.display = 'grid';
        }

        /**
         * Función para refrescar el ranking cada 30 segundos
         */
        function iniciarRefrescoAutomatico() {
            setInterval(() => {
                if (document.visibilityState === 'visible') {
                    console.log('🔄 Refrescando ranking automáticamente...');
                    cargarRanking();
                }
            }, 30000); // 30 segundos
        }

        // Inicializar cuando se carga la página
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎮 Página de ranking cargada');
            cargarRanking();
            iniciarRefrescoAutomatico();
        });

        // Manejar tecla F5 o Ctrl+R para refrescar
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                cargarRanking();
            }
        });