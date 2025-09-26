/* ===== SOHO STUDIO ANIMATIONS ===== */

// Smooth scroll animations and interactions
class SohoAnimations {
    constructor() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupNavigationAnimations();
        this.setupFormAnimations();
        this.setupCarouselIntegration();
    }

    setupScrollAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe all elements with animation classes
        const animatedElements = document.querySelectorAll(
            '.hero-soho-studio, .founders-soho-studio, .services-soho-studio, .cta-soho-studio, .realizacje-soho-studio'
        );

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            observer.observe(el);
        });

        // Add CSS for animation
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            
            .hero-soho-studio,
            .founders-soho-studio,
            .services-soho-studio,
            .cta-soho-studio,
            .realizacje-soho-studio {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }
        `;
        document.head.appendChild(style);
    }

    setupHoverEffects() {
        // Enhanced hover effects for buttons
        const buttons = document.querySelectorAll('.btn-hero-soho, .btn-services-soho, .btn-cta-soho, .btn-realizacje-soho, .btn-oferta-soho');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
        });

        // Service item hover effects
        const serviceItems = document.querySelectorAll('.service-soho-studio-item, .oferta-service-item');
        
        serviceItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-8px)';
                item.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateY(0)';
                item.style.boxShadow = 'none';
            });
        });
    }

    setupNavigationAnimations() {
        const nav = document.querySelector('.header-navigation') || document.querySelector('.nav-soho');
        const navLinks = document.querySelectorAll('.nav-item') || document.querySelectorAll('.nav-soho-link');
        
        // Check if nav exists before adding scroll effect
        if (!nav) return;
        
        // Navbar scroll effect
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                nav.style.background = 'rgba(255, 255, 255, 0.98)';
                nav.style.backdropFilter = 'blur(20px)';
            } else {
                nav.style.background = 'rgba(255, 255, 255, 0.95)';
                nav.style.backdropFilter = 'blur(10px)';
            }
            
            lastScrollY = currentScrollY;
        });

        // Active link highlighting
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    link.style.transform = 'translateY(-2px)';
                });
                
                link.addEventListener('mouseleave', () => {
                    link.style.transform = 'translateY(0)';
                });
            });
        }
    }

    setupFormAnimations() {
        const formInputs = document.querySelectorAll('input, textarea');
        
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.style.transform = 'translateY(-2px)';
                input.parentElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.style.transform = 'translateY(0)';
                input.parentElement.style.boxShadow = 'none';
            });
        });
    }

    setupCarouselIntegration() {
        // Smooth integration with 3D carousel
        const carouselIframe = document.querySelector('.carousel-iframe');
        
        if (carouselIframe) {
            // Add loading animation
            carouselIframe.addEventListener('load', () => {
                carouselIframe.style.opacity = '1';
                carouselIframe.style.transform = 'scale(1)';
            });
            
            // Initial state
            carouselIframe.style.opacity = '0';
            carouselIframe.style.transform = 'scale(0.95)';
            carouselIframe.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        }
    }

    // Text reveal animation
    revealText(element) {
        const text = element.textContent;
        element.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `opacity 0.3s ease ${i * 0.02}s, transform 0.3s ease ${i * 0.02}s`;
            element.appendChild(span);
            
            setTimeout(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            }, i * 20);
        }
    }

    // Parallax effect for hero sections
    setupParallax() {
        const heroSections = document.querySelectorAll('.hero-soho-studio, .founders-soho-studio');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            heroSections.forEach(section => {
                const rate = scrolled * -0.5;
                section.style.transform = `translateY(${rate}px)`;
            });
        });
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SohoAnimations();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu toggle
const navToggle = document.querySelector('.nav-soho-toggle');
const navMenu = document.querySelector('.nav-soho-links');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Add mobile menu styles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    @media (max-width: 768px) {
        .nav-soho-links {
            position: fixed;
            top: 80px;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            flex-direction: column;
            padding: 2rem;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .nav-soho-links.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
        }
        
        .nav-soho-toggle.active .hamburger-line:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .nav-soho-toggle.active .hamburger-line:nth-child(2) {
            opacity: 0;
        }
        
        .nav-soho-toggle.active .hamburger-line:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    }
`;
document.head.appendChild(mobileStyles);
