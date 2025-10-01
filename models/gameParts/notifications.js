// Módulo de notificaciones (toast) para el juego
// Uso: import { applyNotifications } from './gameParts/notifications.js'; applyNotifications(Game);

export function applyNotifications(Game) {
    if (!Game || typeof Game !== 'function') return;

    // Evitar aplicar dos veces
    if (Game.__notificationsApplied) return;
    Game.__notificationsApplied = true;

    Game.prototype.showToast = function({ title = 'Mensaje', message = '', type = 'info', timeout = 4200 } = {}) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 11000;
                max-width: 320px;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-msg toast-${type}`;
        toast.style.cssText = `
            display: flex; gap: 10px; padding: 14px 16px; border-radius: 12px; color: #222; background: #fff;
            box-shadow: 0 6px 18px -4px rgba(0,0,0,0.25); position: relative; overflow: hidden;
            font-family: system-ui, sans-serif; animation: toastIn .35s ease; border-left: 6px solid ${typeColor(type)};
        `;

        const iconMap = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
        const icon = iconMap[type] || 'ℹ️';

        toast.innerHTML = `
            <div style="font-size:22px;line-height:1;">${icon}</div>
            <div style="flex:1;">
                <h4 style="margin:0 0 4px;font-size:15px;letter-spacing:.3px;">${title}</h4>
                ${message ? `<div style="margin:0;font-size:13px;line-height:1.3;opacity:.9;">${message}</div>` : ''}
            </div>
            <button aria-label="Cerrar" style="cursor:pointer;background:transparent;border:none;font-size:18px;line-height:1;color:#555;">×</button>
        `;

        const closeBtn = toast.querySelector('button');
        const removeToast = () => {
            toast.style.animation = 'toastOut .35s ease forwards';
            setTimeout(() => toast.remove(), 340);
        };
        closeBtn.addEventListener('click', removeToast);

        container.appendChild(toast);
        if (timeout > 0) setTimeout(removeToast, timeout);

        // Inyectar estilos globales solo una vez
        if (!document.getElementById('toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
                @keyframes toastIn { from {opacity:0; transform: translateY(-8px) scale(.97);} to {opacity:1; transform: translateY(0) scale(1);} }
                @keyframes toastOut { to {opacity:0; transform: translateY(-6px) scale(.95);} }
            `;
            document.head.appendChild(style);
        }
    };

    Game.prototype.notifyInfo = function(title, msg) { this.showToast({ title, message: msg, type: 'info'}); };
    Game.prototype.notifyOk = function(title, msg) { this.showToast({ title, message: msg, type: 'success'}); };
    Game.prototype.notifyWarn = function(title, msg) { this.showToast({ title, message: msg, type: 'warning'}); };
    Game.prototype.notifyError = function(title, msg) { this.showToast({ title, message: msg, type: 'error'}); };

    function typeColor(type){
        return ({ success:'#2ecc71', info:'#3498db', warning:'#f39c12', error:'#e74c3c'})[type] || '#3498db';
    }
}

export default applyNotifications;
