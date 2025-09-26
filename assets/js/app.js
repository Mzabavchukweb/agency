// SPA Router z View Transitions API
class SPARouter {
    constructor() {
        this.app = document.getElementById('app');
        // Capture inline HOME markup to avoid fetching external file
        this.homeHTML = this.app ? this.app.innerHTML : '';
        this.routes = {
            '': 'home',
            'realizacje': 'realizacje',
            'poznaj-nas': 'poznaj-nas',
            'oferta': 'oferta',
            'kontakt': 'kontakt'
        };
        
        this.init();
    }
    
    init() {
        // Intercept kliknięć: rozróżnij kotwice do istniejących sekcji vs. trasy SPA
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"], a[data-spa]');
            if (!a) return;
            const href = a.getAttribute('href') || '';
            const isHash = href.startsWith('#');
            const route = href.replace('#','');

            // Jeżeli link ma data-spa lub wskazuje na znaną trasę i sekcja nie istnieje w DOM → SPA navigate
            const isKnownRoute = Object.prototype.hasOwnProperty.call(this.routes, route);
            const targetEl = isHash ? document.getElementById(route) : null;
            if ((a.hasAttribute('data-spa') || isKnownRoute) && (!targetEl || route === '')) {
                e.preventDefault();
                this.closeMobileMenu();
                this.navigate(route, true);
                return;
            }

            // W przeciwnym razie: klasyczna kotwica do istniejącej sekcji
            if (isHash) {
                this.closeMobileMenu();
                // pozwól przeglądarce przewinąć
                return;
            }
        });
        
        // Obsługa przycisków wstecz/dalej
        window.addEventListener('popstate', (e) => {
            this.navigate(e.state?.url || this.getCurrentRoute(), false);
        });
        
        // Mobile navigation toggle
        this.setupMobileNavigation();
        
        // Inicjalne ładowanie
        this.navigate(this.getCurrentRoute(), false);
    }
    
    getCurrentRoute() {
        return location.hash.replace('#', '') || '';
    }
    
    async navigate(route, pushState = true) {
        const pageName = this.routes[route] || 'home';
        
        try {
            // Dla strony głównej korzystamy z wbudowanej treści (bez fetch)
            if (pageName === 'home') {
                if (document.startViewTransition) {
                    document.startViewTransition(() => {
                        this.app.innerHTML = this.homeHTML;
                        this.updateActiveNav(route);
                    });
                } else {
                    this.app.innerHTML = this.homeHTML;
                    this.updateActiveNav(route);
                }
                if (pushState) {
                    history.pushState({ url: route }, '', `#${route}`);
                }
                this.initPageAnimations();
                if (window.scrollAnimations && typeof window.scrollAnimations.refreshTypography === 'function') {
                    window.scrollAnimations.refreshTypography();
                }
                return;
            }

            // Pokaż loader dla innych podstron
            this.showLoader();
            
            // Pobierz zawartość strony
            const html = await this.fetchPage(pageName);
            
            // View Transition API dla płynnej animacji
            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    this.app.innerHTML = html;
                    this.updateActiveNav(route);
                });
            } else {
                // Fallback dla przeglądarek bez View Transitions
                this.app.innerHTML = html;
                this.updateActiveNav(route);
            }
            
            // Aktualizuj historię
            if (pushState && route) {
                history.pushState({ url: route }, '', `#${route}`);
            }
            
            // Wykonaj animacje po załadowaniu
            this.initPageAnimations();
            // Odśwież typografię na-scroll jeśli dostępna
            if (window.scrollAnimations && typeof window.scrollAnimations.refreshTypography === 'function') {
                window.scrollAnimations.refreshTypography();
            }
            
            // Animacje wyłączone

			// Mostek scrollowania: umożliw przewijanie do stopki po zakończeniu przewijania iframe portfolio
			if (pageName === 'realizacje') {
				this.setupPortfolioScrollBridge();
			}
            
        } catch (error) {
            console.error('Page load error:', error);
            this.showError(error.message);
        }
    }

	// Zapewnia ciągłość przewijania: po dojściu do końca/początku treści iframe przewija stronę główną
	setupPortfolioScrollBridge() {
		const iframe = document.querySelector('.realizacje-embed iframe');
		if (!iframe) return;

		const bindBridge = () => {
			const frameWindow = iframe.contentWindow;
			const frameDoc = iframe.contentDocument || (frameWindow && frameWindow.document);
			if (!frameWindow || !frameDoc) return;

			const getMaxScroll = () => {
				const docEl = frameDoc.documentElement;
				return Math.max(0, (docEl.scrollHeight || 0) - (frameWindow.innerHeight || 0));
			};

			const wheelHandler = (e) => {
				const y = frameWindow.scrollY || frameDoc.documentElement.scrollTop || 0;
				const max = getMaxScroll();
				const atTop = y <= 0;
				const atBottom = y >= max - 1;
				const dy = e.deltaY || 0;
				if ((atBottom && dy > 0) || (atTop && dy < 0)) {
					e.preventDefault();
					window.scrollBy({ top: dy, left: 0, behavior: 'auto' });
				}
			};

			let lastTouchY = null;
			const touchStart = (e) => {
				if (e.touches && e.touches.length) {
					lastTouchY = e.touches[0].clientY;
				}
			};
			const touchMove = (e) => {
				if (lastTouchY == null || !(e.touches && e.touches.length)) return;
				const currentY = e.touches[0].clientY;
				const dy = lastTouchY - currentY; // >0: scroll down
				const y = frameWindow.scrollY || frameDoc.documentElement.scrollTop || 0;
				const max = getMaxScroll();
				const atTop = y <= 0;
				const atBottom = y >= max - 1;
				if ((atBottom && dy > 0) || (atTop && dy < 0)) {
					e.preventDefault();
					window.scrollBy({ top: dy, left: 0, behavior: 'auto' });
				}
				lastTouchY = currentY;
			};

			// Rejestracja nasłuchów wewnątrz iframe
			// Rejestruj w fazie capture, aby wyprzedzić normalizację ScrollSmoother
			frameWindow.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
			frameDoc.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
			frameDoc.documentElement.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
			frameWindow.addEventListener('touchstart', touchStart, { passive: true, capture: true });
			frameWindow.addEventListener('touchmove', touchMove, { passive: false, capture: true });
			frameDoc.addEventListener('touchstart', touchStart, { passive: true, capture: true });
			frameDoc.addEventListener('touchmove', touchMove, { passive: false, capture: true });
		};

		if (iframe.contentWindow && iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
			bindBridge();
		} else {
			iframe.addEventListener('load', bindBridge, { once: true });
		}
	}
    
    async fetchPage(pageName) {
        try {
            const response = await fetch(`pages/${pageName}.html?v=2.0.6`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error(`Failed to fetch page ${pageName}:`, error);
            throw new Error(`Nie można załadować strony: ${pageName}. Sprawdź połączenie internetowe.`);
        }
    }
    
    updateActiveNav(route) {
        // Dynamiczne podświetlanie na podstawie widoczności sekcji
        const sections = [
            { id: 'home' },
            { id: 'poznaj-nas' },
            { id: 'oferta' },
            { id: 'kontakt' }
        ];
        const fromHash = route || (location.hash || '').replace('#','') || 'home';

        // Fallback: ustaw na podstawie hasha
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const fallback = document.querySelector(`.nav-link[href="#${fromHash}"]`);
        if (fallback) fallback.classList.add('active');

        // IO dla realtime podświetlenia
        if (this.navObserver) this.navObserver.disconnect();
        this.navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                if (!id) return;
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                const link = document.querySelector(`.nav-link[href="#${id}"]`);
                if (link) link.classList.add('active');
            });
        }, { root: null, threshold: 0.6 });
        sections.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) this.navObserver.observe(el);
        });
    }
    
    showLoader() {
        this.app.innerHTML = `
            <div class="loader" role="status" aria-live="polite">
                <div class="loader-spinner" aria-hidden="true"></div>
                <p>Ładowanie...</p>
                <span class="sr-only">Ładowanie strony, proszę czekać</span>
            </div>
        `;
    }
    
    showError(errorMessage = '') {
        this.app.innerHTML = `
            <div class="error-page" role="alert">
                <h1>Błąd ładowania strony</h1>
                <p>${errorMessage || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.'}</p>
                <div class="error-actions">
                    <button onclick="window.router.navigate('')" class="btn-primary">Wróć do strony głównej</button>
                    <button onclick="location.reload()" class="btn-secondary">Odśwież stronę</button>
                </div>
            </div>
        `;
    }
    
    setupMobileNavigation() {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                const isOpen = menu.classList.contains('active');
                
                if (isOpen) {
                    this.closeMobileMenu();
                } else {
                    this.openMobileMenu();
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });
            
            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && menu.classList.contains('active')) {
                    this.closeMobileMenu();
                }
            });
        }
    }
    
    openMobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        
        if (toggle && menu) {
            menu.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeMobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        
        if (toggle && menu) {
            menu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
    
    initPageAnimations() {
        // Use AnimationController if available
        if (window.animationController) {
            window.animationController.setupScrollAnimations();
        } else {
            // Fallback animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1 });
            
            document.querySelectorAll('.fade-in').forEach(el => {
                observer.observe(el);
            });
        }

        // Ensure typography is initialized on the first load as well
        if (window.scrollAnimations && typeof window.scrollAnimations.refreshTypography === 'function') {
            window.scrollAnimations.refreshTypography();
        }
    }
}

// Inicjalizacja routera po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    // Note: root-relative link rewrite for file:// removed for production.
    // If you need local preview via file://, you can restore a dev-only helper here.

    // Initialize router
    window.router = new SPARouter();
    
    // Force reload if needed
    if (sessionStorage.getItem('forceReload') === 'true') {
        sessionStorage.removeItem('forceReload');
        window.location.reload();
    }
});

// Store dla globalnego stanu
class Store extends EventTarget {
    constructor() {
        super();
        this.state = {
            currentPage: '',
            isLoading: false,
            theme: 'light'
        };
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.dispatchEvent(new CustomEvent('stateChange', { detail: this.state }));
    }
    
    getState() {
        return this.state;
    }
}

const store = new Store();

// Export dla modułów
window.store = store;
