// Módulo de gestión de dados, turnos y flujo de lanzamiento
// Uso: import { applyTurns } from './gameParts/turns.js'; applyTurns(Game);

export function applyTurns(Game) {
    if (!Game || typeof Game !== 'function') return;
    if (Game.__turnsApplied) return; // evitar doble aplicación
    Game.__turnsApplied = true;

    // Mostrar caja de dados
    Game.prototype.showDiceBox = function() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer) return;
        let diceBox = document.getElementById('diceBox');
        if (!diceBox) {
            diceBox = document.createElement('div');
            diceBox.id = 'diceBox';
            diceBox.style.cssText = `
                position: fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                background: linear-gradient(135deg,#fff,#f8f9fa); border:3px solid ${this.colorToCSS(currentPlayer.color)};
                border-radius:20px; padding:30px; box-shadow:0 15px 35px rgba(0,0,0,.2); z-index:10000; min-width:350px; text-align:center;
            `;
            diceBox.innerHTML = `<div id="diceContent"></div>`;
            document.body.appendChild(diceBox);
        }
        diceBox.style.borderColor = this.colorToCSS(currentPlayer.color);
        const diceContent = diceBox.querySelector('#diceContent');
        diceContent.innerHTML = `
            <div style="margin-bottom:20px;">
                <div style="font-size:24px;color:${this.colorToCSS(currentPlayer.color)};margin-bottom:10px;">${currentPlayer.ficha} ${currentPlayer.nickname}</div>
                <div style="font-size:16px;color:#666;margin-bottom:15px;">Es tu turno • Dinero: $${currentPlayer.dinero || 1500}</div>
                <div style="font-size:18px;color:#333;margin-bottom:20px;">¿Cómo quieres lanzar los dados?</div>
            </div>
            <div style="display:flex;justify-content:center;gap:15px;margin-bottom:20px;">
                <button id="btnAleatorio" class="dice-btn-primary">🎲 Aleatorio</button>
                <button id="btnManual" class="dice-btn-secondary">📝 Manual</button>
            </div>
            <div id="resultadoDados" style="margin:20px 0;"></div>
            <button id="btnCerrarDados" class="dice-btn-close">❌ Cerrar</button>`;
        diceBox.style.display = 'block';
        // estilos reutilizados
        injectDiceStyles();
        document.getElementById('btnAleatorio').addEventListener('click', () => this.lanzarAleatorio());
        document.getElementById('btnManual').addEventListener('click', () => this.lanzarManual());
        document.getElementById('btnCerrarDados').addEventListener('click', () => { diceBox.style.display = 'none'; });
    };

    Game.prototype.lanzarDados = function() { this.showDiceBox(); };

    Game.prototype.lanzarAleatorio = function() {
        const d1 = Math.floor(Math.random()*6)+1; const d2 = Math.floor(Math.random()*6)+1; this.procesarLanzamiento(d1,d2,d1+d2);
    };

    Game.prototype.lanzarManual = function() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if(!currentPlayer) return;
        const diceContent = document.getElementById('diceContent');
        if(!diceContent) return;
        diceContent.innerHTML = `
            <div style="margin-bottom:20px;">
                <div style="font-size:20px;color:${this.colorToCSS(currentPlayer.color)};margin-bottom:10px;">${currentPlayer.ficha} ${currentPlayer.nickname}</div>
                <div style="font-size:15px;color:#333;margin-bottom:15px;">Ingresa cualquier número entero (puede ser negativo para pruebas):</div>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:20px;">
                <input type="number" id="dado1Input" value="1" class="dice-input">
                <span style="font-size:20px;font-weight:bold;">+</span>
                <input type="number" id="dado2Input" value="1" class="dice-input">
            </div>
            <div style="display:flex;justify-content:center;gap:15px;margin-bottom:20px;">
                <button id="btnConfirmarManual" class="dice-btn-primary">Lanzar</button>
                <button id="btnVolver" class="dice-btn-close">Volver</button>
            </div>
            <div id="resultadoDados"></div>`;
        document.getElementById('btnConfirmarManual').addEventListener('click', ()=>{
            const d1 = parseInt(document.getElementById('dado1Input').value,10);
            const d2 = parseInt(document.getElementById('dado2Input').value,10);
            if(Number.isInteger(d1) && Number.isInteger(d2)) this.procesarLanzamiento(d1,d2,d1+d2); else {
                const r = document.getElementById('resultadoDados'); if(r) r.innerHTML = '<div style="color:red;font-weight:bold;">Valores inválidos</div>';
            }
        });
        document.getElementById('btnVolver').addEventListener('click', ()=> this.showDiceBox());
    };

    // Lógica principal de dados con cárcel
    Game.prototype.procesarLanzamiento = function(d1,d2,total){
        const currentPlayer = this.players[this.currentPlayerIndex];
        if(!currentPlayer) return;
        console.log(`🎲 ${currentPlayer.nickname} lanzó: ${d1}+${d2}=${total}`);
        this.mostrarResultadoMejorado(d1,d2,total);
        if(currentPlayer.estaEnCarcel){
            const esDoble = d1===d2;
            const resultado = currentPlayer.tryLeaveJail ? currentPlayer.tryLeaveJail({dice:{isDouble:esDoble}, cost:50,maxTurns:3}) : { freed:false };
            if(resultado.freed){
                const map = { double:'¡Dobles! Sales gratis.', autoPay:'Pagas obligatorio tras 3 intentos.', pay:'Pagaste $50 y sales.' };
                this.notifyOk('🔓 Sales de la cárcel', map[resultado.reason]||'');
                this.movePlayerToken(currentPlayer,total);
            } else {
                                    const intento = currentPlayer.turnosCarcel || 0; // ya incrementado dentro de tryLeaveJail
                                    const restante = Math.max(0, 3 - intento);
                                    let detalle;
                                    if(restante>0){
                                        detalle = `Intento ${intento}/3 • Necesitas DOBLES o pagar $50${currentPlayer.dinero<50?' (no tienes fondos)':''}.`;
                                    } else {
                                        detalle = currentPlayer.dinero>=50 ? 'Se forzará pago de $50 en el próximo intento.' : 'No puedes pagar $50: reúne fondos (hipoteca / vende)';
                                    }
                                    this.notifyWarn('Sigues en la cárcel', detalle);
                setTimeout(()=> this.siguienteTurno(),1500);
                return;
            }
        } else {
            this.movePlayerToken(currentPlayer,total);
        }
        const esDoble = d1===d2;
        setTimeout(()=> { if(esDoble && !currentPlayer.estaEnCarcel) this.manejarDobles(currentPlayer,total); else this.siguienteTurno(); }, 2000);
    };

    Game.prototype.mostrarResultadoMejorado = function(d1,d2,total){
        const currentPlayer = this.players[this.currentPlayerIndex];
        const cont = document.getElementById('resultadoDados');
        if(cont){
            cont.innerHTML = `
                <div style="text-align:center;padding:20px;background:linear-gradient(135deg,${this.colorToCSS(currentPlayer.color)},${this.colorToCSS(currentPlayer.color)}dd);color:#fff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,.3);margin:15px 0;">
                    <div style="font-size:24px;margin-bottom:10px;">🎲 ${d1} + ${d2} = <strong>${total}</strong></div>
                    <div style="font-size:16px;opacity:.9;">${currentPlayer.ficha} ${currentPlayer.nickname} avanza ${total} casillas</div>
                    ${d1===d2?'<div style="font-size:14px;margin-top:8px;animation:pulse 2s infinite;">✨ ¡DOBLES! Juegas otra vez</div>':''}
                </div>`;
        }
        const resumen = document.getElementById('dados-resultado');
        if(resumen) resumen.textContent = `🎲 ${d1} + ${d2} = ${total}`;
    };

    Game.prototype.manejarDobles = function(player){
        const cont = document.getElementById('resultadoDados');
        if(cont){
            cont.innerHTML += `<div style="text-align:center;padding:15px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#333;border-radius:12px;margin:10px 0;font-weight:bold;box-shadow:0 4px 12px rgba(255,215,0,.4);">✨ ¡DOBLES! ${player.nickname} juega otra vez ✨</div>`;
        }
        setTimeout(()=> this.showDiceBox(),2000);
    };

    Game.prototype.siguienteTurno = function(){
        if(!this.players.length) return;
        const actual = this.players[this.currentPlayerIndex];
        document.querySelectorAll(`.player-token[data-player-id="${actual.id}"]`).forEach(t=> t.classList.remove('active'));
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const next = this.players[this.currentPlayerIndex];
        document.querySelectorAll(`.player-token[data-player-id="${next.id}"]`).forEach(t=> t.classList.add('active'));
        console.log(`🔄 Turno de: ${next.nickname}`);
        const diceBox = document.getElementById('diceBox'); if(diceBox) diceBox.style.display='none';
        this.mostrarNotificacionTurno(next);
        this.actualizarEstadoBotones();
        try { this.updatePlayerStatsPanel(); } catch(e) {}
    };

    Game.prototype.mostrarNotificacionTurno = function(player){
        const notif = document.createElement('div');
        notif.className = 'turn-toast';
        notif.innerHTML = `<div class="tt-main">${player.ficha} Turno de ${player.nickname}</div><div class="tt-sub">Haz click para lanzar dados</div>`;
        notif.addEventListener('click', ()=> { this.showDiceBox(); notif.remove(); });
        document.body.appendChild(notif);
        setTimeout(()=> { if(notif.parentNode){ notif.classList.add('out'); setTimeout(()=> notif.remove(),450);} },5000);
        injectTurnStyles();
    };

    // Legacy para compatibilidad
    Game.prototype.mostrarResultado = function(d1,d2,total){ this.mostrarResultadoMejorado(d1,d2,total); this.moveCurrentPlayer(total); };
    Game.prototype.moveCurrentPlayer = function(steps){
        if(!this.players.length) return; const p = this.players[this.currentPlayerIndex]; this.movePlayerToken(p, steps);
    };

    function injectDiceStyles(){
        if(document.getElementById('diceStyles')) return;
        const st = document.createElement('style'); st.id='diceStyles'; st.textContent = `
            .dice-btn-primary, .dice-btn-secondary, .dice-btn-close { border:none; cursor:pointer; font-size:16px; font-weight:bold; padding:15px 25px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,.15); transition:.25s; }
            .dice-btn-primary { background:linear-gradient(135deg,#007bff,#0056b3); color:#fff; }
            .dice-btn-secondary { background:linear-gradient(135deg,#28a745,#1e7e34); color:#fff; }
            .dice-btn-close { background:linear-gradient(135deg,#6c757d,#495057); color:#fff; padding:10px 20px; }
            .dice-btn-primary:hover, .dice-btn-secondary:hover, .dice-btn-close:hover { transform:translateY(-2px); }
            .dice-input { width:80px; height:40px; text-align:center; border:2px solid #0d6efd; border-radius:8px; font-size:16px; font-weight:bold; }
            @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.6;} }
        `; document.head.appendChild(st);
    }
    function injectTurnStyles(){
        if(document.getElementById('turnToastStyles')) return;
        const st = document.createElement('style'); st.id='turnToastStyles'; st.textContent = `
            .turn-toast { position:fixed; top:20px; right:20px; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; padding:18px 22px; border-radius:14px; z-index:9999; font-family:system-ui,sans-serif; box-shadow:0 8px 25px rgba(0,0,0,.3); animation:slideIn .5s ease; cursor:pointer; min-width:220px; }
            .turn-toast.out { animation: slideOut .45s ease forwards; }
            .turn-toast .tt-main { font-size:18px; margin-bottom:4px; font-weight:600; }
            .turn-toast .tt-sub { font-size:13px; opacity:.85; }
            @keyframes slideIn { from { transform:translateX(100%); opacity:0;} to { transform:translateX(0); opacity:1;} }
            @keyframes slideOut { to { transform:translateX(100%); opacity:0;} }
        `; document.head.appendChild(st);
    }
}

export default applyTurns;
