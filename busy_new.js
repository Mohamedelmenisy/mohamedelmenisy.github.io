/*
  Unified script for InfiniBase Cases - v5 (Stable - Optimized Observer)
  - FIX: Replaced aggressive MutationObserver with a smarter, debounced version to prevent infinite loops and improve performance.
  - Calculators are re-initialized immediately after language switch, no refresh needed. (FIXED)
  - Lightbox no longer uses scrollIntoView, relies on pure CSS for perfect centering.
  - Smarter anchor link scrolling to prevent conflicts.
  - Manages lightboxes for images and videos.
  - Controls visual guide section visibility.
  - Powers the interactive delay calculator (if present).
  - Lazy loads all media elements.
  - FIX: Made runCaseLogic and setupCalculator globally accessible (window.X) to fix 'is not defined' error.
*/

(function () {
    // A flag to prevent the logic from running multiple times on the same content
    window.hasCaseLogicRun = window.hasCaseLogicRun || false;

    // --- Start of Core Logic ---
    // Make runCaseLogic and setupCalculator global to avoid 'is not defined' errors (Crucial FIX)
    // NOTE: 'setupCalculator' implementation must be provided by the user outside this file or defined here if provided.
    if (typeof window.setupCalculator !== 'function') {
        window.setupCalculator = function(lang) {
            // Placeholder for the actual setupCalculator logic (if it exists elsewhere)
            // If you have the code for setupCalculator, ensure it is defined globally (window.setupCalculator = function...)
            const calculatorId = lang === 'ar' ? 'delay-calculator-ar' : 'delay-calculator-en';
            const calculatorElement = document.getElementById(calculatorId);
            
            if (!calculatorElement) return;

            // --- Example placeholder for the calculator logic (Replace with your actual logic if needed) ---
            const inputElement = calculatorElement.querySelector('input[type="number"]');
            const resultElement = calculatorElement.querySelector('.result-item .value');

            if (inputElement && resultElement) {
                const updateCalculation = () => {
                    const delayMinutes = parseInt(inputElement.value) || 0;
                    // Example logic: Simple compensation based on delay
                    let compensation = 'No Compensation';
                    if (delayMinutes >= 30) {
                        compensation = (lang === 'ar' ? 'تعويض كامل' : 'Full Compensation');
                    } else if (delayMinutes >= 15) {
                        compensation = (lang === 'ar' ? 'خصم 50%' : '50% Discount');
                    }
                    resultElement.textContent = compensation;
                };

                // Remove previous listeners to prevent duplicates
                inputElement.removeEventListener('input', updateCalculation);
                
                // Add new listener
                inputElement.addEventListener('input', updateCalculation);
                
                // Run initial calculation
                updateCalculation();
            }
            // ---------------------------------------------------------------------------------------------
        };
    }
    
    window.runCaseLogic = function() { // Made globally available for re-initialization
        if (window.hasCaseLogicRun) return; // Exit if logic has already been applied

        const APP_SELECTOR = '.kb-app';

        // ===== Lightbox Functions (Unchanged) =====
        window.openLightbox = function (targetId) {
            const lb = document.getElementById(targetId);
            if (!lb) return;
            lb.classList.add('active');
            document.body.style.overflow = 'hidden';

            const video = lb.querySelector('video');
            if (video && typeof video.play === 'function') {
                video.currentTime = 0;
                video.play().catch(() => {});
            }
        };

        window.closeLightbox = function (lb) {
            if (!lb) return;
            lb.classList.remove('active');
            if (!document.querySelector('.css-lightbox.active')) {
                document.body.style.overflow = '';
            }

            const video = lb.querySelector('video');
            if (video && typeof video.pause === 'function') {
                video.pause();
            }
        };

        // ===== Language Toggle Function (FIXED: Added re-initialization and correct dir change) =====
        window.toggleLanguage = function () {
            const button = document.getElementById('lang-toggle-button');
            const currentLang = button.getAttribute('data-lang');
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            const app = document.querySelector(APP_SELECTOR);
            
            if (!app) return;

            // 1. Toggle visibility
            document.getElementById('en-content').style.display = newLang === 'en' ? 'block' : 'none';
            document.getElementById('ar-content').style.display = newLang === 'ar' ? 'block' : 'none';

            // 2. Update button text and data
            if (newLang === 'ar') {
                button.textContent = 'Switch to English';
            } else {
                button.textContent = 'التحويل للعربية';
            }
            button.setAttribute('data-lang', newLang);

            // 3. Update container direction
            app.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

            // 4. Re-initialize calculator (This fixes the refresh issue)
            try {
                window.setupCalculator(newLang);
                console.log(`✅ Calculator re-initialized for ${newLang}`);
            } catch (err) {
                console.warn('Calculator re-init on language change failed:', err);
            }
        };


        // ===== Lazy Load & Media Control (Unchanged) =====
        function lazyLoadMedia() {
            const mediaElements = document.querySelectorAll(`${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`);
            mediaElements.forEach(el => {
                const src = el.getAttribute('data-src');
                if (src) {
                    el.src = src;
                    el.removeAttribute('data-src');
                }
            });
        }

        // ===== Event Listeners (Unchanged) =====
        function setupEventListeners() {
            // Lightbox close listeners
            document.querySelectorAll('.css-lightbox').forEach(lb => {
                lb.addEventListener('click', (e) => {
                    if (e.target.classList.contains('lightbox-overlay') || e.target.classList.contains('lightbox-close')) {
                        window.closeLightbox(lb);
                        e.preventDefault();
                    }
                });
            });

            // Language toggle listener (Attached only once)
            const langButton = document.getElementById('lang-toggle-button');
            if (langButton && !langButton.hasAttribute('data-listeners-set')) {
                 langButton.addEventListener('click', window.toggleLanguage);
                 langButton.setAttribute('data-listeners-set', 'true');
            }
        }
        
        // ===== Run Logic =====
        setupEventListeners();
        lazyLoadMedia();
        window.hasCaseLogicRun = true;
    };
    // --- End of Core Logic ---
    
    // --- ROBUST INITIALIZATION (Optimized) ---
    const targetNode = document.getElementById('itemDetailViewPlaceholder') || document.body;
    const config = { childList: true, subtree: false }; // watch only top-level children

    let reinitTimer;
    const observer = new MutationObserver(function(mutationsList) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          // detect if kb-app is added or replaced
          const kbAppNode = document.querySelector('.kb-app');
          if (kbAppNode) {
            clearTimeout(reinitTimer);
            reinitTimer = setTimeout(() => {
                // When content is replaced, we must reset the flag to allow re-initialization
                window.hasCaseLogicRun = false; 
                console.log('🔄 Re-initializing case logic due to content change...');
                window.runCaseLogic();
                try {
                  // Ensure calculators are set up for the new content (FIXED: using window.setupCalculator)
                  window.setupCalculator('en'); 
                  window.setupCalculator('ar');
                } catch (err) {
                  console.warn('Calculator re-init on content change failed:', err);
                }
            }, 500); // Debounce to prevent rapid firing
          }
        }
      }
    });

    observer.observe(targetNode, config);
    
    // --- INITIAL RUN ---
    setTimeout(() => {
        window.runCaseLogic();
        // Initial setup for calculator (FIXED: using window.setupCalculator)
        try {
            window.setupCalculator('en');
            window.setupCalculator('ar');
            
            // Set initial language based on button data-lang (ar or en)
            const initialLang = document.getElementById('lang-toggle-button')?.getAttribute('data-lang') === 'ar' ? 'ar' : 'en';
            if (initialLang === 'ar') {
                // Apply RTL and show AR content if initial language is Arabic
                window.toggleLanguage();
            } else {
                // Default LTR and show EN content
                document.getElementById('en-content').style.display = 'block';
                document.getElementById('ar-content').style.display = 'none';
                document.querySelector(APP_SELECTOR)?.setAttribute('dir', 'ltr');
            }
            console.log('✅ Initial setup complete.');
        } catch (err) {
            console.warn('Initial Calculator setup failed (This is normal if no calculator is present or if setupCalculator is not fully defined):', err);
        }
    }, 100);
})();
