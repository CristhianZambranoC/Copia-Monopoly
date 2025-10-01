// Mixin: statsPanel
// Separa la lógica del panel de estadísticas de jugadores.

export function applyStatsPanel(Game){
  if(Game.__statsPanelApplied) return; Game.__statsPanelApplied = true;
  Object.assign(Game.prototype, {
    initPlayerStatsPanel(){
      if(this.playerStatsInitialized) return;
      const panel = document.getElementById('playerStatsPanel'); if(!panel) return;
      if(!document.getElementById('playerStatsStyles')){
        const style = document.createElement('style'); style.id='playerStatsStyles'; style.textContent = `
          .player-stats-panel { display:flex; gap:25px; background:#f8f9fa; padding:15px 20px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,.08); margin-top:15px; flex-wrap:wrap; }
          .player-stats-panel h4,.player-stats-panel h5 { margin:0 0 8px; font-weight:600; }
          .player-stats-panel p { margin:2px 0; font-size:14px; }
          .player-current { min-width:200px; }
          .players-summary { flex:1; min-width:220px; }
          .players-summary ul { list-style:none; padding:0; margin:0; max-height:140px; overflow:auto; }
          .players-summary li { font-size:13px; margin:2px 0; display:flex; gap:6px; align-items:center; }
          .ps-token { width:16px; height:16px; border-radius:50%; display:inline-block; border:2px solid #fff; box-shadow:0 0 0 2px rgba(0,0,0,0.15); }
          .ps-active { font-weight:bold; color:#0d6efd; }
        `; document.head.appendChild(style);
      }
      this.playerStatsInitialized = true;
    },

    updatePlayerStatsPanel(){
      const panel = document.getElementById('playerStatsPanel'); if(!panel || !this.players.length) return;
      const current = this.players[this.currentPlayerIndex];
      const get = id => document.getElementById(id);
      const safeNum = v => (typeof v === 'number' && !isNaN(v) ? v : 0);
      const formato = n => new Intl.NumberFormat('es-CO').format(safeNum(n));
      if(current){
        const props = current.propiedades || [];
        const hipotecadas = props.filter(p=> p.hipotecada || p.isMortgaged).length;
        const ferrocarriles = props.filter(p=> p.type==='railroad').length;
        const casas = props.reduce((a,p)=> a + (p.casas||p.houses||0),0);
        const hoteles = props.filter(p=> p.hotel || p.hasHotel).length;
        const grupos = {}; props.forEach(p=> { if(p.color) grupos[p.color]=(grupos[p.color]||0)+1; });
        const totalColor = {}; (this.board?.squares || []).forEach(s=> { if(s?.color) totalColor[s.color]=(totalColor[s.color]||0)+1; });
        const monopolios = Object.entries(grupos).filter(([c,cnt])=> totalColor[c]===cnt && cnt>0).length;
        const patrimonio = this.calcularPatrimonio ? this.calcularPatrimonio(current) : (current.dinero||0);
        const rentaPotencial = props.reduce((acc,p)=>{ if(p.hipotecada||p.isMortgaged) return acc; const square = this.board?.getSquare ? this.board.getSquare(p.id):null; let r=0; if(square?.rent){ if(square.type==='railroad'){ const owned=ferrocarriles; r = square.rent[String(owned)] || square.rent['1'] || 0; } else if(square.rent.base){ if(p.hotel||p.hasHotel) r = square.rent.withHotel || square.rent.base*5; else if((p.casas||p.houses||0)>0){ const idx=(p.casas||p.houses)-1; r = square.rent.withHouse?.[idx] || square.rent.base*(1+(p.casas||p.houses)); } else r = square.rent.base; } } return acc + (r||0); },0);
        const mortgagePrincipal = props.filter(p=> p.hipotecada || p.isMortgaged).reduce((a,p)=> a + (p.mortgage || Math.floor((p.price||0)/2)),0);
        const mortgageCost = Math.ceil(mortgagePrincipal*1.1);
        const mortgagePercent = props.length ? Math.round((hipotecadas/props.length)*100):0;
        const liquidez = patrimonio ? Math.round((safeNum(current.dinero)/patrimonio)*100) : 0;
        if(get('ps-nombre')) get('ps-nombre').textContent = `${current.ficha||''} ${current.nickname}`.trim();
        if(get('ps-pais')) get('ps-pais').textContent = current.pais || current.country_code || '-';
        const flagImgEl = document.getElementById('ps-flag-img'); const flagEmojiEl = document.getElementById('ps-flag'); const cc = (current.country_code||current.pais||'').toString().trim();
        if(flagImgEl){ if(cc.length===2){ const upper=cc.toUpperCase(); flagImgEl.src=`https://flagsapi.com/${upper}/flat/32.png`; flagImgEl.width=22; flagImgEl.height=16; flagImgEl.style.display='inline-block'; flagImgEl.onerror=()=>{ flagImgEl.style.display='none'; if(flagEmojiEl) flagEmojiEl.style.display='inline'; }; if(flagEmojiEl) flagEmojiEl.style.display='none'; } else { flagImgEl.style.display='none'; if(flagEmojiEl) flagEmojiEl.style.display='inline'; } }
        if(get('ps-dinero')) get('ps-dinero').textContent = formato(current.dinero);
        if(get('ps-posicion')) get('ps-posicion').textContent = current.position ?? 0;
        if(get('ps-propiedades')) get('ps-propiedades').textContent = props.length;
        if(get('ps-hipotecadas')) get('ps-hipotecadas').textContent = hipotecadas;
        if(get('ps-ferrocarriles')) get('ps-ferrocarriles').textContent = ferrocarriles;
        if(get('ps-casas')) get('ps-casas').textContent = casas;
        if(get('ps-hoteles')) get('ps-hoteles').textContent = hoteles;
        if(get('ps-monopolios')) get('ps-monopolios').textContent = monopolios;
        if(get('ps-patrimonio')) get('ps-patrimonio').textContent = formato(patrimonio);
        if(get('ps-renta')) get('ps-renta').textContent = formato(rentaPotencial);
        if(get('ps-mortgage-total')) get('ps-mortgage-total').textContent = formato(mortgagePrincipal);
        if(get('ps-mortgage-cost')) get('ps-mortgage-cost').textContent = formato(mortgageCost);
        if(get('ps-mortgage-percent')) get('ps-mortgage-percent').textContent = mortgagePercent + '%';
        if(get('ps-liquidez')) get('ps-liquidez').textContent = liquidez + '%';
        if(get('ps-carcel')) get('ps-carcel').textContent = current.estaEnCarcel ? `Sí${current.turnosCarcel?` (${current.turnosCarcel}/3)`:''}` : 'No';
        const tokenEl = document.getElementById('pc-token'); if(tokenEl) tokenEl.style.background = this.colorToCSS(current.color || '#64748b');
      }
      const resumen = document.getElementById('ps-resumen');
      if(resumen){ resumen.innerHTML=''; this.players.forEach((p,idx)=>{ const li=document.createElement('li'); const patrimonioP = this.calcularPatrimonio ? this.calcularPatrimonio(p) : (p.dinero||0); const propsP = p.propiedades || []; const hipotecadasP = propsP.filter(pr=> pr.hipotecada || pr.isMortgaged).length; const ferrosP = propsP.filter(pr=> pr.type==='railroad').length; const casasP = propsP.reduce((a,pr)=> a + (pr.casas||pr.houses||0),0); const hotelesP = propsP.filter(pr=> pr.hotel || pr.hasHotel).length; li.className = idx===this.currentPlayerIndex ? 'ps-active':''; li.innerHTML = `<div class="ps-line"><span class="ps-token" style="background:${this.colorToCSS(p.color)}"></span><span>${p.nickname}</span><span class="ps-money">$${formato(p.dinero)}</span></div><div class="ps-metrics"><span title="Propiedades">🏠 ${propsP.length}</span><span title="Hipotecadas">🏦 ${hipotecadasP}</span><span title="Ferrocarriles">🚆 ${ferrosP}</span><span title="Casas">🛖 ${casasP}</span><span title="Hoteles">🏨 ${hotelesP}</span><span title="Patrimonio">📊 ${formato(patrimonioP)}</span></div>`; resumen.appendChild(li); }); }
    }
  });
}

export default applyStatsPanel;
