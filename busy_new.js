/*
  Unified script for InfiniBase Cases - Enhanced Professional Version
  - Handles language toggling with persistence
  - Manages lightboxes with enhanced performance
  - Efficient media loading with Intersection Observer
  - Improved accessibility and user experience
*/

(function () {
    'use strict';
    
    const APP_SELECTOR = '.kb-app';
    const LIGHTBOX_ACTIVE_CLASS = 'active';
    let currentLightbox = null;

    // ===== Lightbox Management =====
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) {
            console.warn(`Lightbox with ID '${targetId}' not found`);
            return;
        }
        
        currentLightbox = lb;
        lb.classList.add(LIGHTBOX_ACTIVE_CLASS);
        document.body.style.overflow = 'hidden';
        
        // Handle video elements
        const video = lb.querySelector('video');
        if (video && typeof video.play === 'function') {
            video.currentTime = 0;
            video.play().catch(err => {
                console.warn('Video autoplay failed:', err);
            });
        }
        
        // Focus management for accessibility
        trapFocus(lb);
    };

    window.closeLightbox = function (targetId) {
        const lb = targetId ? document.getElementById(targetId) : currentLightbox;
        if (!lb) return;
        
        lb.classList.remove(LIGHTBOX_ACTIVE_CLASS);
        document.body.style.overflow = '';
        
        const video = lb.querySelector('video');
        if (video && typeof video.pause === 'function') {
            video.pause();
        }
        
        currentLightbox = null;
    };
    
    // Focus trap for accessibility
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    // ===== Efficient Media Loading =====
    function loadAllMedia() {
        const allMedia = document.querySelectorAll(
            `${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`
        );
        
        // Fallback for browsers without Intersection Observer
        if (!('IntersectionObserver' in window)) {
            allMedia.forEach(media => {
                loadMediaElement(media);
            });
            return;
        }
        
        const observerOptions = {
            root: null,
            rootMargin: '50px 0px',
            threshold: 0.1
        };
        
        const mediaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMediaElement(entry.target);
                    mediaObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        allMedia.forEach(media => {
            if (!media.src) {
                mediaObserver.observe(media);
            }
        });
    }
    
    function loadMediaElement(media) {
        const dataSrc = media.getAttribute('data-src');
        if (!dataSrc) return;
        
        media.src = dataSrc;
        media.removeAttribute('data-src');
        
        if (media.tagName === 'VIDEO') {
            media.load();
        }
    }
    
    // ===== Language Management =====
    function toggleLanguage() {
        const button = document.getElementById("lang-toggle-button");
        const appWrapper = document.querySelector(APP_SELECTOR);
        if (!button || !appWrapper) return;

        const isArabicActive = appWrapper.getAttribute('dir') === 'rtl';
        const newLang = isArabicActive ? 'en' : 'ar';

        // Update UI
        if (newLang === 'ar') {
            appWrapper.setAttribute('dir', 'rtl');
            button.textContent = "Switch to English";
            button.setAttribute('aria-label', 'التحويل للغة الإنجليزية');
        } else {
            appWrapper.setAttribute('dir', 'ltr');
            button.textContent = "التحويل للعربية";
            button.setAttribute('aria-label', 'Switch to Arabic');
        }
        
        // Save preference
        saveLanguagePreference(newLang);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function saveLanguagePreference(lang) {
        try {
            localStorage.setItem('preferred-language', lang);
        } catch (e) {
            console.warn('Could not save language preference:', e);
        }
    }

    function restoreLanguagePreference() {
        try {
            const preferredLang = localStorage.getItem('preferred-language');
            const appWrapper = document.querySelector(APP_SELECTOR);
            const button = document.getElementById("lang-toggle-button");
            
            if (preferredLang && appWrapper && button) {
                if (preferredLang === 'ar' && appWrapper.getAttribute('dir') !== 'rtl') {
                    appWrapper.setAttribute('dir', 'rtl');
                    button.textContent = "Switch to English";
                    button.setAttribute('aria-label', 'التحويل للغة الإنجليزية');
                } else if (preferredLang === 'en' && appWrapper.getAttribute('dir') !== 'ltr') {
                    appWrapper.setAttribute('dir', 'ltr');
                    button.textContent = "التحويل للعربية";
                    button.setAttribute('aria-label', 'Switch to Arabic');
                }
            }
        } catch (e) {
            console.warn('Could not restore language preference:', e);
        }
    }

    // ===== Smooth Scrolling =====
    function handleSmoothScroll(targetElement, e) {
        e.preventDefault();
        targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Update URL hash without scrolling
        history.pushState(null, null, `#${targetElement.id}`);
    }

    // ===== Enhanced Media Experience =====
    function enhanceMediaExperience() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('loadstart', function() {
                this.style.opacity = '0.7';
            });
            
            video.addEventListener('canplay', function() {
                this.style.opacity = '1';
            });
            
            video.addEventListener('error', function() {
                console.error('Error loading video:', this.src);
                this.style.opacity = '1'; // Reset opacity on error
            });
        });
    }

    // ===== Event Delegation =====
    function setupEventListeners() {
        // Click events
        document.addEventListener('click', function (e) {
            const target = e.target;
            
            // Language toggle
            if (target.closest('#lang-toggle-button')) {
                toggleLanguage();
                return;
            }

            // Lightbox closing
            const overlay = target.closest('.lightbox-overlay');
            const closeBtn = target.closest('.lightbox-close');
            if (overlay || closeBtn) {
                const lb = target.closest('.css-lightbox');
                if (lb && lb.id) {
                    closeLightbox(lb.id);
                    e.preventDefault();
                }
                return;
            }

            // Anchor links handling
            const anchor = target.closest('a[href^="#"]');
            if (anchor) {
                const href = anchor.getAttribute('href');
                if (!href || href === '#') return;
                
                try {
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        if (targetElement.classList.contains('css-lightbox')) {
                            openLightbox(targetElement.id);
                        } else {
                            handleSmoothScroll(targetElement, e);
                        }
                    } else {
                        // Fallback for dynamic content
                        const elementId = href.substring(1);
                        const fallbackElement = document.getElementById(elementId);
                        if (fallbackElement) {
                            handleSmoothScroll(fallbackElement, e);
                        }
                    }
                } catch (err) {
                    console.error("Could not handle anchor click:", err);
                }
                return;
            }
            
            // Lightbox opening via data attributes
            const lightboxTrigger = target.closest('[data-lightbox]');
            if (lightboxTrigger) {
                const lightboxId = lightboxTrigger.getAttribute('data-lightbox');
                if (lightboxId) {
                    openLightbox(lightboxId);
                    e.preventDefault();
                }
            }
        });

        // Touch events (passive for better performance)
        document.addEventListener('touchstart', function (e) {
            // Add touch-specific handlers if needed
        }, { passive: true });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape") {
                closeLightbox();
            }
            
            // Tab key trapping in lightbox
            if (e.key === "Tab" && currentLightbox) {
                trapFocusInLightbox(e);
            }
        });
    }
    
    function trapFocusInLightbox(e) {
        const focusableElements = currentLightbox.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    // ===== Initialization =====
    function init() {
        restoreLanguagePreference();
        loadAllMedia();
        enhanceMediaExperience();
        setupEventListeners();
        
        // Add loaded class for CSS transitions
        setTimeout(() => {
            document.documentElement.classList.add('js-loaded');
        }, 100);
    }

    // Start the application
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 0);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

})();
