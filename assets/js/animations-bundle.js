/**
 * Advanced Scroll Animations - SOHO Studio Style
 * Modern scroll-driven animations with performance optimization
 */

class AdvancedScrollAnimations {
    constructor() {
        this.elements = [];
        this.isScrolling = false;
        this.scrollTimeout = null;
		this.typographySplits = [];
		this.typographyTriggers = [];
		this.useGSAP = false;
        this.DEBUG = Boolean(window && window.__SCROLL_DEBUG__);
        
        this.init();
    }
    
    init() {
		this.setupIntersectionObserver();
		this.setupSmoothScroll();
		this.setupParallaxEffects();
		this.bindEvents();

		// Prefer GSAP-based engine if available
		const forceFallback = document.documentElement.hasAttribute('data-force-fallback');
		const libs = {
			gsap: typeof window.gsap !== 'undefined',
			ScrollTrigger: typeof window.ScrollTrigger !== 'undefined',
			SplitType: typeof window.SplitType !== 'undefined'
		};
		this.useGSAP = (!forceFallback && libs.gsap && libs.ScrollTrigger && libs.SplitType);
		try {
			console.log('[scroll-anim] init', { forceFallback, libs, useGSAP: this.useGSAP });
		} catch (_) {}
		if (this.useGSAP) {
			// Zarejestruj ScrollTrigger plugin
			if (window.gsap && window.ScrollTrigger) {
				window.gsap.registerPlugin(window.ScrollTrigger);
				// Wyłącz ostrzeżenia „GSAP target not found” dla brakujących selektorów (inne podstrony)
				try { window.gsap.config({ nullTargetWarn: false }); } catch(_) {}
			}
			this.initGSAPTypography();
			this.initGSAPExtras();
		} else {
			this.initTypographyAnimations();
		}
    }
    
    /**
     * Re-attach observers and recompute items after SPA route changes
     */
    refreshAll() {
        try {
            // Reconnect reveal observer
            if (this.observer && typeof this.observer.disconnect === 'function') {
                this.observer.disconnect();
            }
            this.setupIntersectionObserver();

            // Re-scan parallax targets and update once
            this.parallaxElements = document.querySelectorAll('.parallax-section');
            this.handleParallax();

            // Refresh typography engine (GSAP or fallback)
            if (this.useGSAP) {
                this.destroyGSAPTypography();
                this.initGSAPTypography();
                this.initGSAPExtras();
            } else {
                this.refreshTypography();
            }

            // Force progress bar update
            this.updateScrollProgress();
        } catch (e) {
            try { console.error('[scroll-anim] refreshAll error', e); } catch(_) {}
		}
    }
    
    /**
     * Setup Intersection Observer for reveal animations
     */
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-10% 0px -10% 0px',
            threshold: 0.1
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const delay = parseInt(element.dataset.delay) || 0;
                    
                    setTimeout(() => {
                        element.classList.add('revealed');
                        
                        // Trigger character animation for titles
                        if (element.classList.contains('hero-brand') || 
                            element.classList.contains('hero-tagline')) {
                            this.animateCharacters(element);
                        }
                    }, delay);
                    
                    this.observer.unobserve(element);
                }
            });
        }, options);
        
        // Observe all scroll-reveal elements (except hero which is handled by GSAP)
        document.querySelectorAll('.scroll-reveal:not(.hero-soho-badge):not(.hero-brand):not(.hero-tagline):not(.hero-scroll-indicator)').forEach(el => {
            this.observer.observe(el);
        });
        
        // Also observe fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            this.observer.observe(el);
        });
    }
    
    /**
     * Character-by-character animation for titles
     */
    animateCharacters(element) {
        const text = element.textContent;
        element.innerHTML = '';
        
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.03}s`;
            
            element.appendChild(span);
            
            // Trigger animation
            requestAnimationFrame(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            });
        });
    }
    
    /**
     * Setup smooth scrolling for navigation
     */
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                
                if (target) {
                    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset;
                    const headerHeight = document.querySelector('.nav')?.offsetHeight || 0;
                    
                    window.scrollTo({
                        top: offsetTop - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    /**
     * Setup parallax effects for sections
     */
    setupParallaxEffects() {
        this.parallaxElements = document.querySelectorAll('.parallax-section');
        
        if (this.parallaxElements.length > 0) {
            this.handleParallax();
        }
    }
    
    /**
     * Handle parallax scroll effects
     */
    handleParallax() {
        const scrollY = window.pageYOffset;
        
        this.parallaxElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const speed = 0.5;
            const yPos = -(scrollY * speed);
            
            if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
                element.style.setProperty('--parallax-y', `${yPos}px`);
            }
        });
    }
    
    /**
     * Bind scroll events with throttling
     */
    bindEvents() {
        let ticking = false;
        
		const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleParallax();
                    this.updateScrollProgress();
					if (!this.useGSAP) {
						this.updateTypographyProgress();
					}
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Update scroll progress indicator - DISABLED
     */
    updateScrollProgress() {
        // Disabled - no scroll progress bar
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate positions and update animations
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            // Re-observe elements if needed
            this.observer.disconnect();
            this.setupIntersectionObserver();
        }, 250);
    }
    
    /**
     * Add magnetic effect to buttons
     */
    addMagneticEffect() {
        const magneticElements = document.querySelectorAll('.btn-soho, .nav-btn');
        
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        });
    }
    
    /**
     * Initialize cursor follower
     */
    initCursorFollower() {
        if (window.innerWidth > 1024) { // Only on desktop
            const cursor = document.createElement('div');
            cursor.className = 'custom-cursor';
            document.body.appendChild(cursor);
            
            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
            
            // Add hover effects
            document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
            });
        }
    }
    
    /**
     * Destroy instance and clean up
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
    }

    /**
     * Typography on-scroll animations (inspired by Codrops set 2)
     */
	initTypographyAnimations() {
        this.autoAttachTypography();
        this.typographyElements = Array.from(document.querySelectorAll('[data-typo]'));
        this.typographyElements.forEach((element) => this.prepareTypography(element));

        if (!this.typographyObserver) {
            this.typographyObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const el = entry.target;
                    if (entry.isIntersecting) {
                        el.classList.add('inview');
                    } else {
                        el.classList.remove('inview');
                    }
                });
            }, { root: null, rootMargin: '-10% 0px -10% 0px', threshold: 0 });
        }

        this.typographyElements.forEach((el) => this.typographyObserver.observe(el));
        this.updateTypographyProgress();
    }

    autoAttachTypography() {
        const scope = document.getElementById('app') || document;
        const headings = Array.from(scope.querySelectorAll('h1, h2, h3, .hero-brand, .hero-tagline'));
        const texts = Array.from(scope.querySelectorAll('p, li, blockquote'));
        const ctas = Array.from(scope.querySelectorAll('a.btn-primary, button.btn-primary, a.btn-secondary, button.btn-secondary, .nav-btn, .btn-soho, a.project-link'));

        headings.forEach((el) => {
            if (!el.hasAttribute('data-typo') && !el.hasAttribute('data-typo-disabled')) {
                el.setAttribute('data-typo', 'split-chars');
            }
        });

        texts.forEach((el) => {
            if (!el.hasAttribute('data-typo') && !el.hasAttribute('data-typo-disabled')) {
                el.setAttribute('data-typo', 'fade-blur');
            }
        });

        ctas.forEach((el) => {
            if (!el.hasAttribute('data-typo') && !el.hasAttribute('data-typo-disabled')) {
                el.setAttribute('data-typo', 'slide-up');
            }
        });
    }

    prepareTypography(element) {
        if (element.dataset.typoPrepared === 'true') return;

        const type = element.dataset.typo || 'slide-up';
        const split = element.dataset.typoSplit || (type === 'split-chars' ? 'chars' : 'words');
        const originalText = element.textContent || '';
        const text = originalText.trim();
        if (!text) return;

        element.setAttribute('aria-label', text);
        element.innerHTML = '';

        let index = 0;
        if (split === 'chars') {
            [...text].forEach((char) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.setProperty('--d', String(index));
                element.appendChild(span);
                index += 1;
            });
        } else {
            text.split(/(\s+)/).forEach((token) => {
                if (token.trim() === '') {
                    const space = document.createTextNode(token);
                    element.appendChild(space);
                    return;
                }
                const span = document.createElement('span');
                span.className = 'word';
                span.textContent = token;
                span.style.setProperty('--d', String(index));
                element.appendChild(span);
                index += 1;
            });
        }

        element.dataset.typoPrepared = 'true';
    }

    updateTypographyProgress() {
        if (!this.typographyElements || this.typographyElements.length === 0) return;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        this.typographyElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const start = viewportHeight * 0.85; // start animating when element approaches viewport bottom
            const end = viewportHeight * 0.15;   // finish near top
            const distance = Math.max(1, start - end);
            const position = (start - rect.top) / distance;
            const progress = Math.max(0, Math.min(1, position));
            element.style.setProperty('--typo-progress', progress.toFixed(3));
        });
    }

    /**
     * Re-scan and prepare new typography elements (for SPA route changes)
     */
	refreshTypography() {
		const forceFallback = document.documentElement.hasAttribute('data-force-fallback');
		const libsReady = (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined' && typeof window.SplitType !== 'undefined');
		if (!forceFallback && libsReady) {
			this.useGSAP = true;
			this.destroyGSAPTypography();
			this.initGSAPTypography();
			// Re-init extra GSAP effects for newly injected SPA content
			this.initGSAPExtras();
			return;
		}
		this.useGSAP = false;
		this.autoAttachTypography();
		this.typographyElements = Array.from(document.querySelectorAll('[data-typo]'));
		this.typographyElements.forEach((element) => this.prepareTypography(element));
		if (this.typographyObserver) {
			this.typographyElements.forEach((el) => this.typographyObserver.observe(el));
		}
		this.updateTypographyProgress();
	}

	/**
	 * 🎬 SPECTACULAR GSAP ANIMATIONS - CODROPS STYLE
	 * Every section gets a unique, eye-catching effect!
	 */
    initGSAPTypography() {
		console.log('🎬 initGSAPTypography called');
		if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
			try { console.warn('[scroll-anim] GSAP missing - using fallback'); } catch(_) {}
			this.useGSAP = false;
			this.initTypographyAnimations();
			// Fallback: animate hero with CSS transitions
			this.initHeroFallback();
			return;
		}

		console.log('🎬 GSAP available, registering ScrollTrigger');
		window.gsap.registerPlugin(window.ScrollTrigger);

		// 🎯 HERO SECTION - wyłączone
		// this.initHeroEffects();
		
		// Wszystkie animacje wyłączone
		
		// 🚫 Wyłączamy dodatkowe GSAP split-text dla tytułów, żeby uniknąć dublowania z VariedHeadlinesAnimator
		// this.initSplitTextEffects();
		
		// 📄 OTHER PAGES EFFECTS
		this.initOtherPagesEffects();

		try { 
			console.log('🎬 [GSAP] Spectacular animations loaded!', {
				gsap: !!window.gsap,
				ScrollTrigger: !!window.ScrollTrigger,
				SplitType: !!window.SplitType,
				useGSAP: this.useGSAP
			}); 
		} catch(_) {}
	}

	/**
	 * 🎯 HERO SECTION - Animacje jako dodatek do widocznych elementów
	 */
	initHeroEffects() {
		console.log('🎬 initHeroEffects started');
		// Hero badge - delikatne wejście od razu
		window.gsap.fromTo('.hero-soho-badge',
			{ y: 30, opacity: 1 },
			{ 
				y: 0, 
				opacity: 1,
				duration: 1,
				delay: 0.2,
				ease: 'power2.out'
			}
		);

		// HEADLINE INTENSE (Codrops Set 2) — dokładny efekt z briefu
		setTimeout(() => {
			const headline = document.querySelector('.headline-intense');
			if (!headline) return;
		window.gsap.registerPlugin(window.ScrollTrigger);
			window.gsap.to('.headline-intense',
				{ rotationX: 0, scale: 1, opacity: 1, ease: 'none',
				  scrollTrigger: { trigger: '.headline-intense', start: 'top 85%', end: 'top 40%', scrub: 1 } }
			);
				if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
					window.ScrollTrigger.refresh();
				}
		}, 100);

		// Hero subtitle - fade up
		window.gsap.fromTo('.hero-soho-subtitle',
			{ y: 20, opacity: 1 },
			{ 
				y: 0, 
				opacity: 1,
				duration: 0.8,
				delay: 0.8,
				ease: 'power2.out'
			}
		);

		// Scroll indicator - bounce
		window.gsap.fromTo('.hero-scroll-indicator',
			{ y: 20, opacity: 1 },
			{ 
				y: 0, 
				opacity: 1,
				duration: 0.8,
				delay: 1,
				ease: 'bounce.out'
			}
		);
	}

	/**
	 * 🎨 FOUNDERS - Delikatne efekty bez zmiany układu
	 */
	initFoundersEffects() {
		// Background text - subtelna paralaksa
		window.gsap.utils.toArray('.soho-main-text').forEach((text, i) => {
			window.gsap.fromTo(text,
				{ y: 50, opacity: 1 },
				{
					y: -10,
					opacity: 1,
					ease: 'none',
					scrollTrigger: {
						trigger: text,
						start: 'top 90%',
						end: 'bottom 30%',
						scrub: 1
					}
				}
			);
		});

		// Image - delikatne skalowanie
		window.gsap.fromTo('.soho-image-container',
			{ scale: 0.9, opacity: 1 },
			{
				scale: 1,
				opacity: 1,
				duration: 1.5,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.soho-image-container',
					start: 'top 80%'
				}
			}
		);

		// Overlay text - fade up
		window.gsap.fromTo('.soho-overlay-text',
			{ y: 40, opacity: 1 },
			{
				y: 0,
				opacity: 1,
				duration: 1.2,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.soho-overlay-text',
					start: 'top 85%'
				}
			}
		);
	}

	/**
	 * ⚡ SERVICES - Delikatne wejścia elementów
	 */
	initServicesEffects() {
		// Services title - fade up
		window.gsap.fromTo('.services-soho-title',
			{ y: 30, opacity: 1 },
			{
				y: 0,
				opacity: 1,
				duration: 1,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.services-soho-title',
					start: 'top 85%'
				}
			}
		);

		// Service items - staggered fade up
		window.gsap.utils.toArray('.service-soho-item').forEach((item, i) => {
			window.gsap.fromTo(item,
				{ y: 40, opacity: 1, scale: 0.95 },
				{
					y: 0,
					opacity: 1,
					scale: 1,
					duration: 0.8,
					delay: i * 0.1,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: item,
						start: 'top 85%'
					}
				}
			);
		});

		// CTA Button - bounce in
		window.gsap.fromTo('.btn-soho',
			{ y: 30, opacity: 1, scale: 0.9 },
			{
				y: 0,
				opacity: 1,
				scale: 1,
				duration: 1,
				ease: 'back.out(1.4)',
				scrollTrigger: {
					trigger: '.btn-soho',
					start: 'top 85%'
				}
			}
		);
	}

	/**
	 * 🔥 PROCESS - Delikatne wejścia kroków
	 */
	initProcessEffects() {
		// Process title - fade up
		window.gsap.fromTo('.process-soho-title',
			{ y: 40, opacity: 1 },
			{
				y: 0,
				opacity: 1,
				duration: 1,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.process-soho-title',
					start: 'top 85%'
				}
			}
		);

		// Process items - staggered slide in
		window.gsap.utils.toArray('.process-soho-item').forEach((item, i) => {
			window.gsap.fromTo(item,
				{ x: -50, y: 30, opacity: 1 },
				{
					x: 0,
					y: 0,
					opacity: 1,
					duration: 0.8,
					delay: i * 0.2,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: item,
						start: 'top 85%'
					}
				}
			);
		});
	}

	/**
	 * 💎 TESTIMONIAL - Delikatne wejście
	 */
	initTestimonialEffects() {
		window.gsap.fromTo('.testimonial-content',
			{ y: 50, opacity: 1, scale: 0.95 },
			{
				y: 0,
				opacity: 1,
				scale: 1,
				duration: 1.2,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.testimonial-content',
					start: 'top 85%'
				}
			}
		);
	}

	/**
	 * 🌊 CTA - Delikatne animacje przycisków
	 */
	initCTAEffects() {
		// CTA title - fade up
		window.gsap.fromTo('.inspiring-cta-title',
			{ y: 40, opacity: 1 },
			{
				y: 0,
				opacity: 1,
				duration: 1,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.inspiring-cta-title',
					start: 'top 85%'
				}
			}
		);

		// CTA buttons - staggered bounce
		window.gsap.utils.toArray('.inspiring-cta-btn').forEach((btn, i) => {
			window.gsap.fromTo(btn,
				{ y: 30, opacity: 1, scale: 0.9 },
				{
					y: 0,
					opacity: 1,
					scale: 1,
					duration: 0.8,
					delay: i * 0.1,
					ease: 'back.out(1.4)',
					scrollTrigger: {
						trigger: btn,
						start: 'top 85%'
					}
				}
			);
		});
	}

	/**
	 * 🚀 SPLIT-TEXT EFFECTS - Delikatne efekty liter
	 */
	initSplitTextEffects() {
		if (typeof window.SplitType === 'undefined') return;

		// Split selected headings for subtle character animation
		const headings = document.querySelectorAll('.services-soho-title, .process-soho-title, .inspiring-cta-title');
		
		headings.forEach(heading => {
			if (heading.querySelector('.word, .char')) return; // Skip if already split
			
			try {
				const split = new window.SplitType(heading, { types: 'chars' });
				this.typographySplits.push(split);

				window.gsap.fromTo(split.chars,
					{ y: 20, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						duration: 0.6,
						stagger: 0.03,
						ease: 'power2.out',
						scrollTrigger: {
							trigger: heading,
							start: 'top 85%'
						}
					}
				);
			} catch (e) {
				try { console.error('[GSAP] SplitType error:', e); } catch(_) {}
			}
		});
	}

	/**
	 * 📄 OTHER PAGES EFFECTS - Animacje dla innych stron SPA
	 */
	initOtherPagesEffects() {
		// Portfolio page effects
		this.initPortfolioEffects();
		
		// About page effects  
		this.initAboutEffects();
		
		// Services page effects
		this.initServicesPageEffects();
		
		// Contact page effects
		this.initContactEffects();
	}

	/**
	 * 🎨 PORTFOLIO PAGE - Efekty dla strony realizacji
	 */
	initPortfolioEffects() {
		// Portfolio hero
		window.gsap.fromTo('.portfolio-hero-title',
			{ y: 50, opacity: 1 },
			{
				y: 0,
				opacity: 1,
				duration: 1,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.portfolio-hero-title',
					start: 'top 85%'
				}
			}
		);

		// Portfolio items - staggered reveal
		window.gsap.utils.toArray('.portfolio-soho-item').forEach((item, i) => {
			window.gsap.fromTo(item,
				{ y: 60, opacity: 1, scale: 0.9 },
				{
					y: 0,
					opacity: 1,
					scale: 1,
					duration: 0.8,
					delay: i * 0.2,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: item,
						start: 'top 85%'
					}
				}
			);
		});

		// 3D Carousel rotation on scroll
		const ring = document.querySelector('.carousel3d-ring');
		if (ring && window.gsap && window.ScrollTrigger) {
			const slides = ring.querySelectorAll('.carousel3d-item');
			const total = slides.length;
			if (!total) return;
			const step = 360 / total;
			const ringWidth = ring.clientWidth;
			const radius = Math.max(Math.floor(ringWidth / 2), 400);
			slides.forEach((el, i) => {
				el.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
			});
			window.gsap.fromTo(ring,
				{ rotateY: 0 },
				{ rotateY: 360, ease: 'none',
				  scrollTrigger: { trigger: '.carousel3d-section', start: 'top bottom', end: '+=200%', scrub: true }
				}
			);
		}

		// Codrops 3DCarousel integration (portfolio-codrops)
		const codropsScene = document.querySelector('.portfolio-codrops .scene');
		if (codropsScene && window.gsap && window.ScrollTrigger) {
			const carousel = codropsScene.querySelector('.carousel');
			const cells = carousel ? carousel.querySelectorAll('.carousel__cell') : [];
			if (carousel && cells.length) {
				const radius = parseFloat(codropsScene.getAttribute('data-radius') || '650');
				const step = 360 / cells.length;
				cells.forEach((cell, i) => {
					cell.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
				});
				window.gsap.fromTo(carousel,
					{ rotationY: 0 },
					{ rotationY: -180, ease: 'none',
					  scrollTrigger: { trigger: codropsScene, start: 'top bottom', end: 'bottom top', scrub: true } }
				);
			}
		}
	}

	/**
	 * 👥 ABOUT PAGE - Efekty dla strony poznaj nas
	 */
	initAboutEffects() {
		// Team members - slide in
		window.gsap.utils.toArray('.simple-member').forEach((member, i) => {
			window.gsap.fromTo(member,
				{ x: i % 2 === 0 ? -60 : 60, y: 40, opacity: 1 },
				{
					x: 0,
					y: 0,
					opacity: 1,
					duration: 1,
					delay: i * 0.2,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: member,
						start: 'top 85%'
					}
				}
			);
		});

		// Stats - counter animation
		window.gsap.utils.toArray('.stat-number').forEach((stat, i) => {
			window.gsap.fromTo(stat,
				{ y: 30, opacity: 1, scale: 0.8 },
				{
					y: 0,
					opacity: 1,
					scale: 1,
					duration: 0.8,
					delay: i * 0.1,
					ease: 'back.out(1.4)',
					scrollTrigger: {
						trigger: stat,
						start: 'top 85%'
					}
				}
			);
		});
	}

	/**
	 * 💼 SERVICES PAGE - Efekty dla strony oferta
	 */
	initServicesPageEffects() {
		// Service items - card reveals
		window.gsap.utils.toArray('.service-item').forEach((item, i) => {
			window.gsap.fromTo(item,
				{ y: 50, opacity: 1, rotateX: 10 },
				{
					y: 0,
					opacity: 1,
					rotateX: 0,
					duration: 0.8,
					delay: i * 0.15,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: item,
						start: 'top 85%'
					}
				}
			);
		});

		// Pricing cards - bounce in
		window.gsap.utils.toArray('.pricing-card').forEach((card, i) => {
			window.gsap.fromTo(card,
				{ y: 40, opacity: 1, scale: 0.95 },
				{
					y: 0,
					opacity: 1,
					scale: 1,
					duration: 0.8,
					delay: i * 0.1,
					ease: 'back.out(1.2)',
					scrollTrigger: {
						trigger: card,
						start: 'top 85%'
					}
				}
			);
		});
	}

	/**
	 * 📞 CONTACT PAGE - Efekty dla strony kontakt
	 */
	initContactEffects() {
		// Contact form - slide in from left
		window.gsap.fromTo('.contact-form-soho',
			{ x: -50, opacity: 1 },
			{
				x: 0,
				opacity: 1,
				duration: 1,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.contact-form-soho',
					start: 'top 85%'
				}
			}
		);

		// Contact info - slide in from right
		window.gsap.fromTo('.contact-info-soho',
			{ x: 50, opacity: 1 },
			{
				x: 0,
				opacity: 1,
				duration: 1,
				delay: 0.2,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.contact-info-soho',
					start: 'top 85%'
				}
			}
		);
	}

	/**
	 * 🔄 HERO FALLBACK - CSS animations gdy GSAP nie działa
	 */
	initHeroFallback() {
		// Animate hero elements with CSS transitions
		const heroElements = [
			{ selector: '.hero-soho-badge', delay: 200 },
			{ selector: '.hero-brand.intense-nature', delay: 400 },
			{ selector: '.hero-tagline.intense-nature', delay: 600 },
			{ selector: '.hero-soho-subtitle', delay: 800 },
			{ selector: '.hero-scroll-indicator', delay: 1000 }
		];

		heroElements.forEach(({ selector, delay }) => {
			const element = document.querySelector(selector);
			if (element) {
				// Start with 3D effect states
				if (selector.includes('intense-nature')) {
					element.style.opacity = '0.001';
					element.style.transform = 'rotateX(35deg) skewY(2deg) scale(0.9)';
					element.style.letterSpacing = '0.25em';
					element.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
					
					// Animate to final state
					setTimeout(() => {
						element.style.opacity = '1';
						element.style.transform = 'rotateX(0deg) skewY(0deg) scale(1)';
						element.style.letterSpacing = '0.02em';
					}, delay);
				} else {
					// Regular elements
					element.style.opacity = '0';
					element.style.transform = 'translateY(30px)';
					element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
					
					setTimeout(() => {
						element.style.opacity = '1';
						element.style.transform = 'translateY(0)';
					}, delay);
				}
			}
		});
	}

	/**
	 * Additional GSAP-based effects (parallax, mask reveal, box anims, pinning, tracking)
	 */
	initGSAPExtras() {
		if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
			return;
		}
		window.gsap.registerPlugin(window.ScrollTrigger);
		this.initParallaxGSAP();
		this.initMaskRevealGSAP();
		this.initBoxAnimsGSAP();
		this.initPinningGSAP();
		this.initTrackingGSAP();
	}

	/** Parallax with variable speeds via data attributes */
	initParallaxGSAP() {
		const layers = Array.from(document.querySelectorAll('[data-parallax], [data-parallax-speed]'));
		layers.forEach((el) => {
			const speed = parseFloat(el.dataset.parallaxSpeed || el.dataset.speed || '0.3');
			const scrub = el.dataset.scrub ? (parseFloat(el.dataset.scrub) || true) : true;
			const tl = window.gsap.to(el, {
				yPercent: () => -(speed * 100),
				ease: 'none',
				scrollTrigger: {
					trigger: el,
					start: 'top bottom',
					end: 'bottom top',
					scrub
				}
			});
			this.typographyTriggers.push(tl);
		});
	}

	/** Mask reveal using clip-path inset animation */
	initMaskRevealGSAP() {
		const items = Array.from(document.querySelectorAll('[data-reveal="mask"]'));
		items.forEach((el) => {
			const scrub = el.dataset.scrub ? (parseFloat(el.dataset.scrub) || true) : true;
			const tl = window.gsap.fromTo(el,
				{ clipPath: 'inset(0 0 100% 0)' },
				{ clipPath: 'inset(0 0 0% 0)', ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 35%', scrub } }
			);
			this.typographyTriggers.push(tl);
		});
	}

	/** Box-level animations controlled by data-box-anim */
	initBoxAnimsGSAP() {
		const items = Array.from(document.querySelectorAll('[data-box-anim]'));
		items.forEach((el) => {
			const type = (el.dataset.boxAnim || '').toLowerCase();
			const scrub = el.dataset.scrub ? (parseFloat(el.dataset.scrub) || true) : true;
			const defaults = { ease: 'none' };
			let from = {}, to = {};
			switch (type) {
				case 'fade':
					from = { opacity: 0, y: 20 };
					to = { opacity: 1, y: 0 };
					break;
				case 'fade-out':
					from = { opacity: 1 };
					to = { opacity: 0 };
					break;
				case 'scale':
					from = { scale: 0.85, opacity: 0 };
					to = { scale: 1, opacity: 1 };
					break;
				case 'rotate':
					from = { rotation: -8, opacity: 0 };
					to = { rotation: 0, opacity: 1 };
					break;
				case 'skew':
					from = { skewX: 10, y: 60, opacity: 0 };
					to = { skewX: 0, y: 0, opacity: 1 };
					break;
				case 'tilt-3d':
					from = { rotateX: 25, y: 80, opacity: 0, transformPerspective: 1000 };
					to = { rotateX: 0, y: 0, opacity: 1 };
					break;
				case 'zoom':
					from = { scale: 0.75, opacity: 0 };
					to = { scale: 1, opacity: 1 };
					break;
				default:
					from = { opacity: 0, y: 30 };
					to = { opacity: 1, y: 0 };
			}
			const tl = window.gsap.fromTo(el, { ...from }, { ...to, ...defaults, scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 35%', scrub } });
			this.typographyTriggers.push(tl);
		});
	}

	/** Pinning/sticky sections with inner animations */
	initPinningGSAP() {
		const pinned = Array.from(document.querySelectorAll('[data-pin]'));
		pinned.forEach((el) => {
			const end = el.dataset.pinEnd || '+=100%';
			const st = window.ScrollTrigger.create({
				trigger: el,
				start: 'top top',
				end,
				pin: true,
				pinSpacing: true
			});
			this.typographyTriggers.push(st);
		});
	}

	/** Tracking/kerning animation through letter-spacing */
	initTrackingGSAP() {
		const items = Array.from(document.querySelectorAll('[data-tracking-start], [data-tracking-end], [data-tracking]'));
		items.forEach((el) => {
			const scrub = el.dataset.scrub ? (parseFloat(el.dataset.scrub) || true) : true;
			const start = el.dataset.trackingStart || el.dataset.tracking || '0.1em';
			const end = el.dataset.trackingEnd || '0em';
			const tl = window.gsap.fromTo(el,
				{ letterSpacing: start },
				{ letterSpacing: end, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 35%', scrub } }
			);
			this.typographyTriggers.push(tl);
		});
	}

	/**
	 * Debug helper attached to window
	 */
	getDebugInfo() {
		const libs = {
			gsap: typeof window.gsap !== 'undefined',
			ScrollTrigger: typeof window.ScrollTrigger !== 'undefined',
			SplitType: typeof window.SplitType !== 'undefined'
		};
		const typoEls = Array.from(document.querySelectorAll('[data-typo]'));
		return {
			useGSAP: this.useGSAP,
			libs,
			typoCount: typoEls.length,
			firstTypoSample: typoEls.slice(0, 3).map(el => ({
				tag: el.tagName,
				type: el.dataset.typo,
				inview: el.classList.contains('inview'),
				progress: getComputedStyle(el).getPropertyValue('--typo-progress').trim()
			}))
		};
	}

	destroyGSAPTypography() {
		if (this.typographyTriggers) {
			this.typographyTriggers.forEach((tl) => {
				if (tl && tl.scrollTrigger) {
					tl.scrollTrigger.kill();
				}
				tl.kill && tl.kill();
			});
			this.typographyTriggers = [];
		}
		if (this.typographySplits) {
			this.typographySplits.forEach((split) => {
				try { split.revert(); } catch (e) {}
			});
			this.typographySplits = [];
		}
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimations = new AdvancedScrollAnimations();
    
    // Add magnetic effects and cursor follower
    window.scrollAnimations.addMagneticEffect();
    window.scrollAnimations.initCursorFollower();

    // Expose debug helper
    window.scrollAnimationsDebug = () => window.scrollAnimations && typeof window.scrollAnimations.getDebugInfo === 'function' ? window.scrollAnimations.getDebugInfo() : null;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedScrollAnimations;
}
// Advanced animations and effects
class AnimationController {
    constructor() {
        this.observers = new Map();
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupParallax();
        this.setupLenis();
    }
    
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observers.set('fadeIn', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.observers.get('fadeIn').unobserve(entry.target);
                }
            });
        }, options));
        
        this.observers.set('slideUp', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${entry.target.dataset.delay || 0}ms`;
                    entry.target.classList.add('slide-up-visible');
                    this.observers.get('slideUp').unobserve(entry.target);
                }
            });
        }, options));
        
        this.observers.set('counter', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    this.observers.get('counter').unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 }));
    }
    
    setupScrollAnimations() {
        // Reveal animations
        document.querySelectorAll('.fade-in').forEach(el => {
            this.observers.get('fadeIn').observe(el);
        });
        
        // Slide up animations
        document.querySelectorAll('.slide-up').forEach((el, index) => {
            el.dataset.delay = index * 100;
            this.observers.get('slideUp').observe(el);
        });
        
        // Counter animations
        document.querySelectorAll('.stat-number').forEach(el => {
            this.observers.get('counter').observe(el);
        });
    }
    
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        if (parallaxElements.length === 0) return;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        };
        
        window.addEventListener('scroll', updateParallax);
    }
    
    setupLenis() {
        // Smooth scroll with Lenis-like behavior
        let ticking = false;
        
        const smoothScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const rate = scrolled * -0.5;
                    
                    document.querySelectorAll('.parallax-bg').forEach(el => {
                        el.style.transform = `translateY(${rate}px)`;
                    });
                    
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', smoothScroll, { passive: true });
    }
    
    animateCounter(element) {
        const target = parseInt(element.dataset.count);
        const suffix = element.textContent.includes('%') ? '%' : '';
        const duration = 2000;
        const start = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(progress * target);
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
    
    // Text reveal animation
    revealText(element) {
        const text = element.textContent;
        element.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${index * 50}ms`;
            span.classList.add('char-reveal');
            element.appendChild(span);
        });
    }
    
    // Morphing text animation
    morphText(element, texts, duration = 2000) {
        let currentIndex = 0;
        
        const morph = () => {
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.textContent = texts[currentIndex];
                element.style.opacity = '1';
                currentIndex = (currentIndex + 1) % texts.length;
                
                setTimeout(morph, duration);
            }, 300);
        };
        
        morph();
    }
    
    // Page transition effects
    createPageTransition(fromPage, toPage, direction = 'forward') {
        const transition = document.createElement('div');
        transition.className = `page-transition ${direction}`;
        
        document.body.appendChild(transition);
        
        // Animate in
        requestAnimationFrame(() => {
            transition.classList.add('active');
        });
        
        // Animate out
        setTimeout(() => {
            transition.classList.remove('active');
            setTimeout(() => {
                transition.remove();
            }, 500);
        }, 500);
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.animationController = new AnimationController();
});

// Export for use in other modules
export { AnimationController };

// Hero title explosion -> reassemble animation
class HeroAnimation {
    constructor(options = {}) {
        const defaults = {
            selector: '.headline-intense',
            scatterRadius: 600,
            durationIn: 900,
            stagger: 18,
            ease: 'cubic-bezier(0.22, 1, 0.36, 1)'
        };
        this.config = { ...defaults, ...options };
        this.init();
    }

    init() {
        const title = document.querySelector(this.config.selector);
        if (!title || title.dataset.heroAnimated === '1') return;
        title.dataset.heroAnimated = '1';

        const chars = [];
        const fragments = document.createDocumentFragment();

        // Build spans from text nodes; preserve <br>
        const buildFromNode = (node) => {
            if (node.nodeType === 1 && node.tagName === 'BR') {
                fragments.appendChild(document.createElement('br'));
                return;
            }
            const text = (node.textContent || '').toString();
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                const span = document.createElement('span');
                span.setAttribute('data-hero-char', '');
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, letter-spacing';
                span.style.opacity = '1';
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.config.scatterRadius * (Math.random() > 0.5 ? 1 : 0.5);
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                // brak pochylenia – zawsze prosto
                const rx = 0, ry = 0, rz = 0;
                span.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.6)`;

                chars.push({ span, x, y, rx, ry, rz });
                fragments.appendChild(span);
            }
        };

        // Iterate current child nodes to preserve line breaks
        const nodes = Array.from(title.childNodes);
        nodes.forEach(buildFromNode);

        // Replace content
        title.innerHTML = '';
        title.appendChild(fragments);

        // Force layout before binding scroll
        void title.offsetWidth; // reflow

        // Bind directional snap: scroll down -> assemble, scroll up -> scatter
        this.setupDirectionalSnap(title, chars);
    }

    setupDirectionalSnap(title, chars) {
        let isAssembled = false;

        const assemble = () => {
            if (isAssembled) return;
            isAssembled = true;
            chars.forEach((c, i) => {
                const delay = i * (this.config.stagger / 1000);
                c.span.style.transition = `transform 240ms ${this.config.ease} ${delay}s, opacity 200ms ease ${delay}s`;
                c.span.style.opacity = '1';
                c.span.style.transform = 'translate3d(0,0,0) scale(1)';
            });
        };

        const scatter = () => {
            if (!isAssembled) return;
            isAssembled = false;
            chars.forEach((c, i) => {
                const delay = i * (this.config.stagger / 1000);
                c.span.style.transition = `transform 220ms ${this.config.ease} ${delay}s, opacity 200ms ease ${delay}s`;
                c.span.style.opacity = '1';
                c.span.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(0.6)`;
            });
        };

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target !== title) return;
                if (entry.isIntersecting) assemble();
                else scatter();
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
        io.observe(title);
    }
}

// expose to window and module
window.HeroAnimation = HeroAnimation;
if (typeof module !== 'undefined' && module.exports) {
    module.exports.HeroAnimation = HeroAnimation;
}

// Multi-headline animator (similar behavior to HeroAnimation)
class MultiHeadlineAnimator {
    constructor(selectors = []) {
        this.selectors = selectors;
        this.items = [];
        this.lastScrollY = window.scrollY || window.pageYOffset || 0;
        this.observeAndInit();
    }

    observeAndInit() {
        const targets = this.selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const el = entry.target;
                const item = this.items.find(i => i.el === el) || this.buildItem(el);
                if (!item) return;
                item.inView = entry.isIntersecting;
                if (entry.isIntersecting) {
                    this.assemble(item);
                } else {
                    this.scatter(item);
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

        targets.forEach(el => {
            const item = this.buildItem(el);
            if (item) io.observe(el);
        });
    }

    buildItem(el) {
        if (!el || el.dataset.mha === '1') return null;
        el.dataset.mha = '1';
        const chars = [];
        const fragments = document.createDocumentFragment();

        const buildFromNode = (node, parent) => {
            if (node.nodeType === 1 && node.tagName === 'BR') {
                parent.appendChild(document.createElement('br'));
                return;
            }
            if (node.nodeType === 1) {
                const clone = node.cloneNode(false);
                parent.appendChild(clone);
                Array.from(node.childNodes).forEach(n => buildFromNode(n, clone));
                return;
            }
            const text = (node.textContent || '').toString();
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                const span = document.createElement('span');
                span.setAttribute('data-hero-char', '');
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, letter-spacing';
                span.style.opacity = '1';
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 480;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance * 0.7;
                span.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.7)`;
                chars.push({ span, x, y });
                parent.appendChild(span);
            }
        };

        // Build tree and replace content
        const wrapper = document.createElement(el.tagName.toLowerCase());
        Array.from(el.childNodes).forEach(n => buildFromNode(n, wrapper));
        el.innerHTML = '';
        while (wrapper.firstChild) fragments.appendChild(wrapper.firstChild);
        el.appendChild(fragments);

        const item = { el, chars, inView: false, assembled: false };
        this.items.push(item);
        return item;
    }

    assemble(item) {
        if (item.assembled) return;
        item.assembled = true;
        item.chars.forEach((c, i) => {
            const delay = i * 0.018;
            c.span.style.transition = `transform 240ms cubic-bezier(0.22,1,0.36,1) ${delay}s, opacity 180ms ease ${delay}s`;
            c.span.style.opacity = '1';
            c.span.style.transform = 'translate3d(0,0,0) scale(1)';
        });
    }

    scatter(item) {
        if (!item.assembled) return;
        item.assembled = false;
        item.chars.forEach((c, i) => {
            const delay = i * 0.015;
            c.span.style.transition = `transform 200ms cubic-bezier(0.22,1,0.36,1) ${delay}s, opacity 160ms ease ${delay}s`;
            c.span.style.opacity = '1';
            c.span.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(0.7)`;
        });
    }
}

window.MultiHeadlineAnimator = MultiHeadlineAnimator;

// Varied effects per headline
class VariedHeadlinesAnimator {
    constructor(configs = []) {
        this.configs = configs; // [{selector, effect}]
        this.items = []; // {el, effect, spans, inView, assembled}
        this.lastScrollY = window.scrollY || 0;
        this.lastDir = 0; // 1 down, -1 up
        this.io = new IntersectionObserver(this.onIntersect.bind(this), { threshold: 0.1 });
        this.init();
    }

    init() {
        this.configs.forEach(cfg => {
            document.querySelectorAll(cfg.selector).forEach(el => {
                const item = this.buildItem(el, cfg.effect);
                if (item) {
                    // Wymuś stan startowy (rozsypka/ukryty) natychmiast
                    this.scatter(item);
                    this.io.observe(el);
                }
            });
        });

        const boundOnScroll = this.onScroll.bind(this);
        window.addEventListener('scroll', boundOnScroll, { passive: true });
        // Wheel/touch direction for pewny reverse
        window.addEventListener('wheel', (e) => {
            const dir = Math.sign(e.deltaY);
            if (dir !== 0) this.handleDirection(dir);
        }, { passive: true, capture: true });
        let lastTouchY = null;
        window.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length) lastTouchY = e.touches[0].clientY;
        }, { passive: true, capture: true });
        window.addEventListener('touchmove', (e) => {
            if (lastTouchY == null || !(e.touches && e.touches.length)) return;
            const cy = e.touches[0].clientY; const dir = Math.sign(lastTouchY - cy);
            lastTouchY = cy; if (dir !== 0) this.handleDirection(dir);
        }, { passive: true, capture: true });
    }

    onIntersect(entries) {
        entries.forEach(entry => {
            const item = this.items.find(i => i.el === entry.target);
            if (!item) return;
            item.inView = entry.isIntersecting;
            if (entry.isIntersecting) this.assemble(item);
            else this.scatter(item);
        });
    }

    onScroll() {
        // Scroll nie steruje stanem; tylko IO decyduje o złożeniu/rozsypaniu
        this.lastScrollY = window.scrollY || 0;
    }

    isNearViewport(el, margin = 240) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        return r.bottom > -margin && r.top < vh + margin;
    }

    handleDirection(dir) {
        this.lastDir = dir;
        const targets = this.items.filter(i => this.isNearViewport(i.el));
        if (dir > 0) {
            targets.forEach(i => this.assemble(i));
        } else if (dir < 0) {
            targets.forEach(i => this.scatter(i));
        }
    }

    buildItem(el, effect) {
        if (!el || el.dataset.vha === '1') return null;
        el.dataset.vha = '1';
        const spans = [];
        const buildFromNode = (node, parent) => {
            if (node.nodeType === 1 && node.tagName === 'BR') { parent.appendChild(document.createElement('br')); return; }
            if (node.nodeType === 1) {
                const clone = node.cloneNode(false);
                parent.appendChild(clone);
                Array.from(node.childNodes).forEach(n => buildFromNode(n, clone));
                return;
            }
            const text = (node.textContent || '').toString();
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                const span = document.createElement('span');
                span.setAttribute('data-hero-char', '');
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, letter-spacing';
                this.setInitial(span, i, effect);
                spans.push(span);
                parent.appendChild(span);
            }
        };
        const wrapper = document.createElement(el.tagName.toLowerCase());
        Array.from(el.childNodes).forEach(n => buildFromNode(n, wrapper));
        el.innerHTML = '';
        while (wrapper.firstChild) el.appendChild(wrapper.firstChild);
        const item = { el, effect, spans, inView: false, assembled: false };
        this.items.push(item);
        return item;
    }

    setInitial(span, index, effect) {
        if (effect === 'typewriter') {
            span.style.opacity = '0';
            span.style.transform = 'none';
        } else if (effect === 'slideLR') {
            const dir = index % 2 === 0 ? -1 : 1;
            span.style.opacity = '0.4';
            span.style.transform = `translate3d(${dir * 80}px, 0, 0)`;
        } else { // explode default
            const angle = Math.random() * Math.PI * 2;
            const dist = 420 * (0.4 + Math.random()*0.6);
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist * 0.7;
            span.style.opacity = '1';
            span.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.7)`;
            span.dataset._x = x; span.dataset._y = y;
        }
    }

    assemble(item) {
        if (item.assembled) return;
        item.assembled = true;
        if (item.effect === 'typewriter') {
            item.spans.forEach((s, i) => {
                const d = i * 0.03;
                s.style.transition = `opacity 140ms ease ${d}s`;
                s.style.opacity = '1';
            });
        } else if (item.effect === 'slideLR') {
            item.spans.forEach((s, i) => {
                const d = i * 0.02;
                s.style.transition = `transform 240ms cubic-bezier(0.22,1,0.36,1) ${d}s, opacity 160ms ease ${d}s`;
                s.style.opacity = '1';
                s.style.transform = 'translate3d(0,0,0)';
            });
        } else {
            item.spans.forEach((s, i) => {
                const d = i * 0.018;
                s.style.transition = `transform 240ms cubic-bezier(0.22,1,0.36,1) ${d}s, opacity 180ms ease ${d}s`;
                s.style.opacity = '1';
                s.style.transform = 'translate3d(0,0,0) scale(1)';
            });
        }
    }

    scatter(item) {
        if (!item.assembled) return;
        item.assembled = false;
        if (item.effect === 'typewriter') {
            item.spans.forEach((s, i) => {
                const d = i * 0.02;
                s.style.transition = `opacity 120ms ease ${d}s`;
                s.style.opacity = '0';
            });
        } else if (item.effect === 'slideLR') {
            item.spans.forEach((s, i) => {
                const dir = i % 2 === 0 ? -1 : 1;
                const d = i * 0.015;
                s.style.transition = `transform 200ms cubic-bezier(0.22,1,0.36,1) ${d}s, opacity 140ms ease ${d}s`;
                s.style.opacity = '0.4';
                s.style.transform = `translate3d(${dir * 80}px, 0, 0)`;
            });
        } else {
            item.spans.forEach((s, i) => {
                const d = i * 0.015;
                const x = s.dataset._x || 0, y = s.dataset._y || 0;
                s.style.transition = `transform 200ms cubic-bezier(0.22,1,0.36,1) ${d}s, opacity 160ms ease ${d}s`;
                s.style.opacity = '1';
                s.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.7)`;
            });
        }
    }
}

window.VariedHeadlinesAnimator = VariedHeadlinesAnimator;
