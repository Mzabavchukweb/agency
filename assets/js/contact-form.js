// Enhanced Contact Form Handler - SOHO Style
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.init();
    }

    init() {
        if (this.form) {
            this.setupEventListeners();
            this.setupValidation();
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    setupValidation() {
        this.validators = {
            name: (value) => {
                if (!value.trim()) return 'Imię i nazwisko jest wymagane';
                if (value.trim().length < 2) return 'Imię musi mieć co najmniej 2 znaki';
                return null;
            },
            email: (value) => {
                if (!value.trim()) return 'Email jest wymagany';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Podaj prawidłowy adres email';
                return null;
            },
            message: (value) => {
                if (!value.trim()) return 'Opis projektu jest wymagany';
                if (value.trim().length < 10) return 'Opis musi mieć co najmniej 10 znaków';
                return null;
            }
        };
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const validator = this.validators[fieldName];
        
        if (validator) {
            const error = validator(value);
            this.showFieldError(field, error);
            return !error;
        }
        return true;
    }

    showFieldError(field, error) {
        const container = field.closest('.input-container, .textarea-container');
        const errorElement = container.querySelector('.form-error');
        
        if (error) {
            container.classList.add('error');
            errorElement.textContent = error;
        } else {
            this.clearError(field);
        }
    }

    clearError(field) {
        const container = field.closest('.input-container, .textarea-container');
        const errorElement = container.querySelector('.form-error');
        
        container.classList.remove('error');
        errorElement.textContent = '';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Honeypot check
        const hp = this.form.querySelector('input[name="hp"]');
        if (hp && hp.value) {
            return; // silently drop bots
        }

        // Validate all fields
        const isValid = this.validateAllFields();
        if (!isValid) {
            this.showNotification('Proszę poprawić błędy w formularzu', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData);
            
            const response = await fetch(this.form.getAttribute('action') || '/api/contact', {
                method: this.form.getAttribute('method') || 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            this.showNotification('Wiadomość została wysłana! Skontaktujemy się z Tobą wkrótce.', 'success');
            this.form.reset();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Wystąpił błąd podczas wysyłania. Spróbuj ponownie.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateAllFields() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    setLoadingState(loading) {
        // Dostosowanie do struktury przycisku w index.html (.creative-btn lub .btn-primary)
        const button = this.form.querySelector('.creative-btn, .btn-primary');
        if (!button) return;
        if (loading) {
            button.classList.add('loading');
            button.setAttribute('aria-busy', 'true');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.removeAttribute('aria-busy');
            button.disabled = false;
        }
    }

    // removed simulated submitForm

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Zamknij">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler();
});
