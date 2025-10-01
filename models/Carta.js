// Carta.js  (MODELO)
export default class Carta {
  constructor({ id, descripcion, tipo, accion = {} }) {
    this.id = id;
    this.descripcion = descripcion;
    this.tipo = tipo; // "chance" | "community_chest"
    this.accion = accion;
  }

  static desdeJSON(obj) {
    return new Carta({
      id: obj.id,
      descripcion: obj.description,
      tipo: obj.type,
      accion: obj.action || {},
    });
  }

  get esPositiva() {
    const m = Number(this.accion?.money ?? 0);
    return m > 0;
  }

  get valor() {
    return Number(this.accion?.money ?? 0);
  }

  aplicarA(jugador) {
    const delta = this.valor;
    if (typeof jugador?.dinero === "number") {
      jugador.dinero += delta;
    }
    return {
      cartaId: this.id,
      tipo: this.tipo,
      descripcion: this.descripcion,
      deltaDinero: delta,
      dineroFinal: jugador?.dinero,
    };
  }

  render() {
    const root = document.createElement("article");
    root.className = `card-monopoly ${this.tipo}`;
    root.setAttribute("data-id", String(this.id));

    const band = document.createElement("div");
    band.className = "band-logo";
    band.textContent = "MONOPOLY";
    root.appendChild(band);

    const header = document.createElement("header");
    header.className = "card-header";
    header.setAttribute("data-id", String(this.id));
    header.innerHTML = `
      <div class="chip-tipo">
        ${this.tipo === "chance" ? "Sorpresa" : "Caja de Comunidad"}
      </div>
      <div class="icono">
        ${
          this.tipo === "chance"
            ? `
            <svg viewBox="0 0 64 64" aria-hidden="true" class="icono-sorpresa">
              <path d="M32 8c-9.9 0-18 6.4-18 16h8c0-5 4.5-8 10-8s10 3 10 8c0 3.5-2.2 6-5.4 7.9-2.1 1.2-3.6 2.2-4.4 3.1-.8.9-1.2 2-.2 6h8c-.2-1.7-.2-2.5.2-3 .6-.8 1.6-1.8 3.1-2.7C47.4 32 50 27.8 50 24c0-9.6-8.1-16-18-16z"/>
              <circle cx="32" cy="52" r="4"/>
            </svg>`
            : `
            <svg viewBox="0 0 64 64" aria-hidden="true" class="icono-cofre">
              <path d="M8 26v22c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V26H8zM56 20H8l6-8h36l6 8z"/>
              <rect x="28" y="30" width="8" height="10" rx="1" ry="1"/>
            </svg>`
        }
      </div>`;
    root.appendChild(header);

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <p class="descripcion">${this.descripcion}</p>
      <div class="valor ${this.esPositiva ? "positivo" : "negativo"}">
        ${this.esPositiva ? "+$" : "-$"}${Math.abs(this.valor)}
      </div>`;
    root.appendChild(body);

    const footer = document.createElement("footer");
    footer.className = "card-footer";
    const sello = document.createElement("div");
    sello.className = "sello";
    sello.textContent = "© Parker Brothers / Hasbro — Uso académico";
    footer.appendChild(sello);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-aplicar";
    btn.textContent = "Aplicar efecto a Jugador Demo";
    btn.addEventListener("click", () => {
      const dineroEl = document.querySelector("#dinero-demo");
      const dinero = Number(dineroEl?.textContent ?? "1500");
      const jugadorDemo = { dinero };
      this.aplicarA(jugadorDemo);
      if (dineroEl) dineroEl.textContent = String(jugadorDemo.dinero);

      const logEl = document.querySelector("#log");
      if (logEl) {
        const li = document.createElement("li");
        li.textContent = `[${this.tipo}] ${this.descripcion} (Δ $${this.valor > 0 ? "+" : ""}${this.valor}) → Dinero: $${jugadorDemo.dinero}`;
        logEl.prepend(li);
      }
    });
    footer.appendChild(btn);

    root.appendChild(footer);
    return root;
  }
}

