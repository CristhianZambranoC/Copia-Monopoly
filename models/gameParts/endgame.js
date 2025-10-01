// Módulo de fin de juego: ranking, ganador, envío de puntajes, patrimonio
export function applyEndgame(Game){
  if(!Game || typeof Game !== 'function') return;
  if(Game.__endgameApplied) return; Game.__endgameApplied = true;

  Game.prototype.calcularValorHipotecas = function(player){
    if (!player?.propiedades) return 0;
    return player.propiedades.reduce((acc, prop)=>{
      if(!prop.hipotecada) return acc;
      let sq=null;
      try {
        if(this.board?.getSquare) sq=this.board.getSquare(prop.id); else if(Array.isArray(this.board?.squares)) sq=this.board.squares[prop.id]; else if(this.board?.squares?.get) sq=this.board.squares.get(prop.id)||this.board.squares.get(String(prop.id));
      } catch(e){}
      const valorHipoteca = sq?.mortgage || Math.floor((prop.price||0)/2);
      return acc + valorHipoteca;
    },0);
  };

  Game.prototype.calcularPatrimonio = function(player){
    let patrimonio = player?.dinero || 0;
    const props = player?.propiedades || [];
    if(!props.length) return patrimonio;
    props.forEach(prop=>{
      if(prop.hipotecada) return; // excluida
      patrimonio += (prop.price ?? 100);
      if(prop.casas) patrimonio += prop.casas * 100;
      if(prop.hotel) patrimonio += 200;
    });
    return patrimonio;
  };

  Game.prototype.mostrarGanadorActual = function(){
    if(!this.players?.length){ this.showToast?.({ title:'Sin jugadores', message:'No hay jugadores para evaluar.', type:'warning', timeout:4000 }); return; }
    let ganador = this.players[0]; let mejor = this.calcularPatrimonio(ganador);
    for(let i=1;i<this.players.length;i++){ const p=this.players[i]; const pat=this.calcularPatrimonio(p); if(pat>mejor){ mejor=pat; ganador=p; } }
    this.showToast?.({ title:'🏆 Ganador Actual', message:`${ganador.ficha?ganador.ficha+' ':''}${ganador.nickname} - $${mejor}`, type:'info', timeout:5000 });
  };

  Game.prototype.mostrarModalGanador = function(resultados, ganador){
    if(!ganador) return; if(!Array.isArray(resultados)) resultados=[]; resultados=[...resultados].sort((a,b)=> b.patrimonio - a.patrimonio);
    const previo = document.getElementById('winnerModalOverlay'); if(previo) previo.remove();
    const overlay = document.createElement('div'); overlay.id='winnerModalOverlay'; overlay.className='winner-modal-overlay';
    const patrimonioGanador = this.calcularPatrimonio(ganador);
    const topRankingHTML = resultados.map((r,i)=>{ const medalla=i===0?'🥇':i===1?'🥈':i===2?'🥉':'👤'; return `<li><span class="rk-left">${medalla} ${r.jugador.nickname}</span><span class="rk-right">$${r.patrimonio}${r.valorHipotecas>0?` <small class=hipotecas>(-$${r.valorHipotecas})</small>`:''}</span></li>`; }).join('');
    overlay.innerHTML = `\n      <div class="winner-modal" role="dialog" aria-modal="true" aria-labelledby="winnerModalTitle">\n        <button class="winner-close" aria-label="Cerrar">×</button>\n        <h2 id="winnerModalTitle" class="winner-title">🏆 Ganador de la Partida</h2>\n        <div class="winner-main">\n          <div class="winner-player">${ganador.ficha?ganador.ficha+' ':''}${ganador.nickname}</div>\n          <div class="winner-patrimonio" title="Patrimonio Neto">$${patrimonioGanador}</div>\n        </div>\n        <h3 class="winner-subtitle">Ranking Final</h3>\n        <ol class="winner-ranking">${topRankingHTML}</ol>\n        <div class="winner-actions">\n          <button id="winnerCerrarBtn" class="winner-btn primary">Cerrar</button>\n        </div>\n      </div>`;
    document.body.appendChild(overlay);
    const cerrar=()=> overlay.classList.remove('show');
    overlay.addEventListener('click', e=>{ if(e.target===overlay) cerrar(); });
    overlay.querySelector('.winner-close')?.addEventListener('click', cerrar);
    overlay.querySelector('#winnerCerrarBtn')?.addEventListener('click', cerrar);
    requestAnimationFrame(()=> overlay.classList.add('show'));
  };

  Game.prototype.enviarPuntajesAlBackend = async function(resultados){
    try {
      const { API_BASE } = await import('../../utils/config.mjs');
      // Payload enriquecido
      const payload = resultados.map((r,idx)=>({
        nick_name: r.jugador.nickname || r.jugador.ficha || `player_${idx+1}`,
        score: r.patrimonio,
        country_code: (r.jugador.country_code || r.jugador.pais || 'co').toString().toLowerCase(),
        position_final: idx+1,
        raw_money: r.jugador.dinero ?? 0,
        properties: r.jugador.propiedades?.length || 0,
        mortgaged: r.propiedadesHipotecadas || 0,
        mortgages_value: r.valorHipotecas || 0,
        net_worth: r.patrimonio - (r.valorHipotecas||0),
        timestamp: new Date().toISOString()
      }));
      console.log('📤 Intentando envío batch de puntajes:', payload);
      // Intentar batch primero
      let batchOk = false;
      try {
        const respBatch = await fetch(`${API_BASE}/score-recorder/batch`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ scores:payload })});
        if(respBatch.ok){ console.log('✅ Envío batch exitoso'); batchOk=true; }
        else console.warn('⚠️ Batch no soportado/respuesta no OK:', respBatch.status);
      } catch(e){ console.warn('⚠️ Error intentando batch, se usará fallback individual', e.message); }
      if(!batchOk){
        console.log('↩️ Fallback: envío individual por jugador');
        for(const item of payload){
          console.log(`📤 Enviando puntaje de ${item.nick_name}: $${item.score}`);
          const response = await fetch(`${API_BASE}/score-recorder`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ nick_name:item.nick_name, score:item.score, country_code:item.country_code })});
          if(!response.ok) throw new Error('HTTP '+response.status);
        }
      }
      console.log('🎉 Todos los puntajes enviados (batch o individual)');
      return true;
    } catch(e){ console.error('❌ Error al enviar puntajes:', e); this.guardarPuntajesLocalmente(resultados); return false; }
  };

  Game.prototype.guardarPuntajesLocalmente = function(resultados){
    try {
      const data = { fecha:new Date().toISOString(), resultados: resultados.map(r=> ({ nickname:r.jugador.nickname, ficha:r.jugador.ficha, patrimonio:r.patrimonio, country_code:(r.jugador.country_code || r.jugador.pais || 'co').toString().toLowerCase() })) };
      localStorage.setItem('ultimoJuego', JSON.stringify(data));
      console.log('💾 Puntajes guardados localmente como respaldo');
    } catch(e){ console.error('❌ Error guardando puntajes localmente', e); }
  };

  Game.prototype.finalizarJuego = async function(){
    if(!confirm('¿Estás seguro de que quieres finalizar el juego?')) return;
    try {
      if(!this.players?.length){ this.notifyWarn?.('Sin jugadores','No hay datos.'); return; }
      let ganador = this.players[0];
      const resultados = this.players.map(p=>{ const patrimonio=this.calcularPatrimonio(p); if(patrimonio>this.calcularPatrimonio(ganador)) ganador=p; return { jugador:p, patrimonio, propiedadesHipotecadas:(p.propiedades||[]).filter(pr=> pr.hipotecada).length, valorHipotecas:this.calcularValorHipotecas(p) }; });
      resultados.sort((a,b)=> b.patrimonio - a.patrimonio);
      const envioExitoso = await this.enviarPuntajesAlBackend(resultados);
      this.mostrarModalGanador(resultados, ganador);
      const topCompacto = resultados.slice(0,5).map((r,i)=> `${i+1}. ${r.jugador.nickname} $${r.patrimonio}`).join('<br>');
      this.showToast?.({ title:'🏆 Juego Finalizado', message:`Ganador: ${ganador.ficha||''} ${ganador.nickname}`, type:'success', timeout:6000 });
      this.showToast?.({ title:'💰 Patrimonio Ganador', message:`$${this.calcularPatrimonio(ganador)}`, type:'info', timeout:6000 });
      this.showToast?.({ title:'📊 Ranking Final', message:topCompacto, type:'info', timeout:8000 });
      this.showToast?.({ title: envioExitoso?'✅ Ranking Global':'⚠️ Aviso', message: envioExitoso?'Puntajes enviados correctamente.':'Puntajes guardados localmente (sin conexión).', type: envioExitoso?'success':'warning', timeout:6000 });
      if(confirm('¿Quieres ver el ranking global de todos los jugadores?')) window.location.href='ranking.html'; else { localStorage.clear(); window.location.href='../index.html'; }
    } catch(e){ console.error('❌ Error al finalizar juego:', e); this.notifyError?.('Error finalizando','Se guardó copia local.'); localStorage.clear(); window.location.href='../index.html'; }
  };
}

export default applyEndgame;
