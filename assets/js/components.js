// Shared Header interactions (mobile menu)
export function initHeader() {
    document.addEventListener('DOMContentLoaded', () => {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const headerNav = document.querySelector('.header-navigation');
        if (!mobileToggle || !headerNav) return;

        mobileToggle.addEventListener('click', () => {
            headerNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            const isExpanded = headerNav.classList.contains('active');
            mobileToggle.setAttribute('aria-expanded', String(isExpanded));
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                headerNav.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (event) => {
            if (!headerNav.contains(event.target) && !mobileToggle.contains(event.target)) {
                headerNav.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// Auto-init when used as script tag without bundler
try { initHeader(); } catch (_) {}
// Web Components - Custom Elements

// Service Card Component
class ServiceCard extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || '';
        const description = this.getAttribute('description') || '';
        const features = this.getAttribute('features') || '';
        
        this.innerHTML = `
            <div class="service-card">
                <h3>${title}</h3>
                <p>${description}</p>
                ${features ? `<ul class="service-features">
                    ${features.split(',').map(feature => `<li>${feature.trim()}</li>`).join('')}
                </ul>` : ''}
            </div>
        `;
    }
}

// Project Card Component
class ProjectCard extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || '';
        const category = this.getAttribute('category') || '';
        const description = this.getAttribute('description') || '';
        const image = this.getAttribute('image') || '';
        const tech = this.getAttribute('tech') || '';
        
        this.innerHTML = `
            <div class="project-item" data-category="${category}">
                <div class="project-image">
                    <img src="${image}" alt="${title}" class="project-img" loading="lazy">
                    <div class="project-overlay">
                        <div class="project-info">
                            <h3>${title}</h3>
                            <p>${description}</p>
                            <div class="project-tech">
                                ${tech.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('')}
                            </div>
                            <a href="#" class="project-link">Zobacz projekt</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Team Member Component
class TeamMember extends HTMLElement {
    connectedCallback() {
        const name = this.getAttribute('name') || '';
        const role = this.getAttribute('role') || '';
        const image = this.getAttribute('image') || '';
        const description = this.getAttribute('description') || '';
        
        this.innerHTML = `
            <div class="team-member">
                <div class="member-image">
                    <img src="${image}" alt="${name}" class="member-img" loading="lazy">
                </div>
                <div class="member-info">
                    <h3>${name}</h3>
                    <p class="member-role">${role}</p>
                    <p class="member-description">${description}</p>
                </div>
            </div>
        `;
    }
}

// Process Step Component
class ProcessStep extends HTMLElement {
    connectedCallback() {
        const number = this.getAttribute('number') || '';
        const title = this.getAttribute('title') || '';
        const description = this.getAttribute('description') || '';
        
        this.innerHTML = `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
            </div>
        `;
    }
}

// Stat Item Component
class StatItem extends HTMLElement {
    connectedCallback() {
        const number = this.getAttribute('number') || '0';
        const suffix = this.getAttribute('suffix') || '';
        const label = this.getAttribute('label') || '';
        
        this.innerHTML = `
            <div class="stat-item">
                <div class="stat-number" data-count="${number}">0${suffix}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
    }
}

// FAQ Item Component (A11y: button + aria-expanded + region)
class FaqItem extends HTMLElement {
    connectedCallback() {
        const question = this.getAttribute('question') || '';
        const answer = this.getAttribute('answer') || '';
        const id = `faq-${Math.random().toString(36).slice(2, 8)}`;
        
        this.innerHTML = `
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false" aria-controls="${id}-ans" id="${id}-btn">
                    <span class="q">${question}</span>
                    <span aria-hidden="true" class="faq-icon">+</span>
                </button>
                <div id="${id}-ans" role="region" aria-labelledby="${id}-btn" hidden>
                    <p>${answer}</p>
                </div>
            </div>
        `;
        
        const btn = this.querySelector('.faq-question');
        const ans = this.querySelector('[role="region"]');
        btn.addEventListener('click', () => {
            const open = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!open));
            ans.hidden = open;
        });
    }
}

// Contact Form Component
class ContactForm extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <form class="contact-form" id="contactForm">
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" name="name" placeholder="Imię i nazwisko" required>
                    </div>
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Email" required>
                    </div>
                </div>
                <div class="form-group">
                    <textarea name="message" placeholder="Opisz swój projekt..." rows="4" required></textarea>
                </div>
                <button type="submit" class="btn-primary">Wyślij</button>
            </form>
        `;
        
        // Add form handler
        this.querySelector('form').addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Wysyłanie...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            this.showMessage('Wiadomość została wysłana pomyślnie!', 'success');
            e.target.reset();
            
        } catch (error) {
            this.showMessage('Wystąpił błąd podczas wysyłania wiadomości.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    showMessage(text, type) {
        const message = document.createElement('div');
        message.className = `form-message ${type}`;
        message.innerHTML = `
            <div class="message-content">
                <span>${text}</span>
            </div>
        `;
        
        this.appendChild(message);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// Register all components
customElements.define('service-card', ServiceCard);
customElements.define('project-card', ProjectCard);
customElements.define('team-member', TeamMember);
customElements.define('process-step', ProcessStep);
customElements.define('stat-item', StatItem);
customElements.define('faq-item', FaqItem);
customElements.define('contact-form', ContactForm);
