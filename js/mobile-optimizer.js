// ===== OPTIMIZACIONES MÓVILES PARA MONOPOLY =====

class MobileGameOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 896;
        this.isLandscape = window.innerHeight < window.innerWidth;
        this.initializeOptimizations();
    }
    
    initializeOptimizations() {
        // Configurar viewport dinámico
        this.setViewportMeta();
        
        // Optimizar modales para móvil
        this.optimizeModals();
        
        // Configurar detección de orientación
        this.setupOrientationDetection();
        
        // Optimizar rendimiento
        this.optimizePerformance();
        
        // Configurar eventos táctiles
        this.setupTouchEvents();
        
        // Inicializar después del DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.finalizeSetup());
        } else {
            this.finalizeSetup();
        }
    }
    
    setViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        // Configuración optimizada para el juego
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
    
    optimizeModals() {
        // Configurar Bootstrap modales para móvil
        const modalConfig = {
            backdrop: 'static',
            keyboard: true,
            focus: true
        };
        
        // Interceptar todos los modales cuando se muestran
        document.addEventListener('show.bs.modal', (event) => {
            const modal = event.target;
            this.prepareModalForMobile(modal);
        });
        
        // Limpiar cuando se ocultan
        document.addEventListener('hidden.bs.modal', (event) => {
            this.cleanupModalMobile();
        });
    }
    
    prepareModalForMobile(modal) {
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '0';
        
        // Configurar el modal para scroll interno
        const modalDialog = modal.querySelector('.modal-dialog');
        const modalContent = modal.querySelector('.modal-content');
        const modalBody = modal.querySelector('.modal-body');
        
        if (modalDialog) {
            modalDialog.style.height = '90vh';
            modalDialog.style.maxHeight = '90vh';
            modalDialog.style.display = 'flex';
            modalDialog.style.alignItems = 'center';
            modalDialog.style.margin = this.isMobile ? '10px' : '1.75rem auto';
        }
        
        if (modalContent) {
            modalContent.style.height = '100%';
            modalContent.style.maxHeight = '100%';
            modalContent.style.display = 'flex';
            modalContent.style.flexDirection = 'column';
            modalContent.style.overflow = 'hidden';
        }
        
        if (modalBody) {
            modalBody.style.overflow = 'auto';
            modalBody.style.overflowX = 'hidden';
            modalBody.style.flex = '1';
            modalBody.style.WebkitOverflowScrolling = 'touch'; // iOS smooth scroll
            modalBody.style.paddingRight = '15px'; // Espacio para scrollbar
            
            // Forzar recalculo de height
            setTimeout(() => {
                modalBody.style.maxHeight = `${modalContent.clientHeight - 120}px`;
            }, 100);
        }
        
        // Agregar indicador de scroll si es necesario
        this.addScrollIndicator(modalBody);
        
        // Focus en el primer input si existe
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea, button');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }
    
    addScrollIndicator(modalBody) {
        if (!modalBody) return;
        
        const checkScroll = () => {
            const hasScroll = modalBody.scrollHeight > modalBody.clientHeight;
            modalBody.style.borderBottom = hasScroll ? '3px solid #007bff' : 'none';
            
            // Mostrar indicador visual de más contenido
            let indicator = modalBody.querySelector('.scroll-indicator');
            if (hasScroll && !indicator) {
                indicator = document.createElement('div');
                indicator.className = 'scroll-indicator';
                indicator.innerHTML = '↓ Más contenido abajo ↓';
                indicator.style.cssText = `
                    position: sticky;
                    bottom: 0;
                    background: linear-gradient(transparent, rgba(0,123,255,0.1));
                    text-align: center;
                    padding: 5px;
                    font-size: 0.8em;
                    color: #007bff;
                    pointer-events: none;
                `;
                modalBody.appendChild(indicator);
            } else if (!hasScroll && indicator) {
                indicator.remove();
            }
        };
        
        // Verificar scroll al inicio y cuando cambie el contenido
        setTimeout(checkScroll, 100);
        modalBody.addEventListener('scroll', checkScroll);
        
        // Observer para cambios en el contenido
        const observer = new MutationObserver(checkScroll);
        observer.observe(modalBody, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }
    
    cleanupModalMobile() {
        // Restaurar scroll del body
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        
        // Limpiar indicadores de scroll
        document.querySelectorAll('.scroll-indicator').forEach(indicator => {
            indicator.remove();
        });
    }
    
    setupOrientationDetection() {
        // Crear aviso de orientación si no existe
        this.createOrientationNotice();
        
        // Manejar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 500); // Delay para que la orientación se complete
        });
        
        // También manejar resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleOrientationChange();
            }, 300);
        });
        
        // Verificación inicial
        this.handleOrientationChange();
    }
    
    createOrientationNotice() {
        if (document.querySelector('.rotation-notice')) return;
        
        const notice = document.createElement('div');
        notice.className = 'rotation-notice';
        notice.innerHTML = `
            <div class="rotate-icon">📱</div>
            <h2>¡Gira tu dispositivo!</h2>
            <p>Para una mejor experiencia, por favor rota tu dispositivo a modo horizontal.</p>
            <p><small>El juego está optimizado para vista landscape en móviles.</small></p>
        `;
        
        document.body.appendChild(notice);
    }
    
    handleOrientationChange() {
        const isMobileSmall = window.innerWidth <= 896 && window.innerHeight <= 500;
        const isPortrait = window.innerHeight > window.innerWidth;
        const notice = document.querySelector('.rotation-notice');
        
        if (isMobileSmall && isPortrait && notice) {
            notice.style.display = 'flex';
        } else if (notice) {
            notice.style.display = 'none';
        }
        
        // Reajustar el layout del juego
        this.adjustGameLayout();
        
        // Recalcular modales si están abiertos
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            setTimeout(() => {
                this.prepareModalForMobile(openModal);
            }, 100);
        }
    }
    
    adjustGameLayout() {
        const mainContainer = document.querySelector('.main-container');
        const mobileLayout = document.querySelector('.mobile-layout');
        const mobileSidebar = document.querySelector('.mobile-sidebar');
        
        if (!mainContainer) return;
        
        // Forzar visibilidad de elementos clave
        const keyElements = document.querySelectorAll('.board-and-actions, .main-board, #boardContainer, .mobile-sidebar');
        keyElements.forEach(element => {
            if (element) {
                element.style.display = '';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
            }
        });
        
        // Aplicar layout móvil si corresponde
        if (window.innerWidth <= 896 && window.innerHeight < window.innerWidth) {
            if (mobileLayout) {
                mobileLayout.style.display = 'flex';
                mobileLayout.style.flexDirection = 'row';
            }
            
            if (mobileSidebar) {
                mobileSidebar.style.display = 'flex';
            }
        }
    }
    
    optimizePerformance() {
        // Desactivar animaciones innecesarias en móviles lentos
        if (this.isMobile && navigator.hardwareConcurrency <= 4) {
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Lazy loading para imágenes si existen
        if ('IntersectionObserver' in window) {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }
    
    setupTouchEvents() {
        // Prevenir zoom en doble tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Mejorar el scrolling táctil
        const scrollableElements = document.querySelectorAll('.modal-body, .mobile-sidebar');
        scrollableElements.forEach(element => {
            element.style.WebkitOverflowScrolling = 'touch';
        });
        
        // Prevenir bounce en iOS
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.modal-body, .mobile-sidebar')) {
                return; // Permitir scroll en estos elementos
            }
            e.preventDefault();
        }, { passive: false });
    }
    
    finalizeSetup() {
        // Configuraciones finales después de que el DOM esté listo
        this.adjustGameLayout();
        
        // Configurar observers para cambios dinámicos
        this.setupContentObserver();
        
        console.log('Optimizaciones móviles inicializadas correctamente');
    }
    
    setupContentObserver() {
        // Observer para detectar cuando se agregan nuevos modales
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('modal')) {
                        this.prepareModalForMobile(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Función específica para habilitar scroll en modales (compatibilidad)
function enableModalScroll() {
    const optimizer = new MobileGameOptimizer();
    
    // Aplicar a modales existentes
    document.querySelectorAll('.modal').forEach(modal => {
        optimizer.prepareModalForMobile(modal);
    });
    
    return optimizer;
}

// Inicialización automática
let mobileOptimizer;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mobileOptimizer = new MobileGameOptimizer();
    });
} else {
    mobileOptimizer = new MobileGameOptimizer();
}

// Exportar para uso externo
window.MobileGameOptimizer = MobileGameOptimizer;
window.enableModalScroll = enableModalScroll;
window.mobileOptimizer = mobileOptimizer;

// ===== UTILIDADES ADICIONALES =====

// Función para forzar redibujado del layout
function forceLayoutRedraw() {
    const elements = document.querySelectorAll('.main-container, .mobile-layout, .board-and-actions');
    elements.forEach(element => {
        if (element) {
            element.style.display = 'none';
            element.offsetHeight; // Forzar reflow
            element.style.display = '';
        }
    });
}

// Función para debugging móvil
function debugMobileLayout() {
    const info = {
        screenWidth: screen.width,
        screenHeight: screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        orientation: screen.orientation?.angle || 'unknown',
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: window.innerWidth <= 896,
        visibleElements: {
            mainContainer: !!document.querySelector('.main-container'),
            mobileLayout: !!document.querySelector('.mobile-layout'),
            boardContainer: !!document.querySelector('#boardContainer'),
            mobileSidebar: !!document.querySelector('.mobile-sidebar')
        }
    };
    
    console.log('Debug Mobile Layout:', info);
    return info;
}

// Exportar utilidades
window.forceLayoutRedraw = forceLayoutRedraw;
window.debugMobileLayout = debugMobileLayout;