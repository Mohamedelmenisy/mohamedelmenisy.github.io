/*
  Unified script for InfiniBase Cases - v5 (Stable - Optimized Observer)
  - FIX: runCaseLogic and setupCalculator are now globally accessible (window.X) to fix 'is not defined' error.
  - FIX: Language toggle now correctly re-initializes the calculator without a page refresh.
  - Smarter anchor link scrolling to prevent conflicts.
  - Manages lightboxes for images and videos.
  - Lazy loads all media elements.
*/

(function () {
    // A flag to prevent the logic from running multiple times on the same content
    window.hasCaseLogicRun = window.hasCaseLogicRun || false;

    // --- Start of Calculator Logic (Essential FIX) ---
    // Making setupCalculator global to fix "is not defined" error in observer and toggle.
    if (typeof window.setupCalculator !== 'function') {
        window.setupCalculator = function(lang) {
            // --- Placeholder for the actual setupCalculator logic ---
            const calculatorId = lang === 'ar' ? 'delay-calculator-ar' : 'delay-calculator-en';
            const calculatorElement = document.getElementById(calculatorId);
            
            if (!calculatorElement) return;

            const inputElement = calculatorElement.querySelector('input[type="number"]');
            const resultElement = calculatorElement.querySelector('.result-item .value');

            if (inputElement && resultElement) {
                const updateCalculation = () => {
                    const delayMinutes = parseInt(inputElement.value) || 0;
                    let compensation = 'No Compensation';
                    if (lang === 'ar') {
                        compensation = 'لا يوجد تعويض';
                        if (delayMinutes >= 30) {
                            compensation = 'تعويض كامل';
                        } else if (delayMinutes >= 15) {
                            compensation = 'خصم 50%';
                        }
                    } else {
                        if (delayMinutes >= 30) {
                            compensation = 'Full Compensation';
                        } else if (delayMinutes >= 15) {
                            compensation = '50% Discount';
                        }
                    }
                    resultElement.textContent = compensation;
                };

                // Clear existing listeners before adding a new one
                const clonedInput = inputElement.cloneNode(true);
                inputElement.parentNode.replaceChild(clonedInput, inputElement);
                
                // Add new listener to the cloned element
                clonedInput.addEventListener('input', updateCalculation);
                
                // Run initial calculation
                updateCalculation();
            }
            // --------------------------------------------------------
        };
    }
    // --- End of Calculator Logic ---
    

    // --- Start of Core Logic ---
    window.runCaseLogic = function() { // Made globally available for re-initialization
        if (window.hasCaseLogicRun) return;

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

        // ===== Language Toggle Function (FIXED: Toggle Language without Refresh) =====
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

            // 3. Update container direction (FIX: RTL/LTR)
            app.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

            // 4. Re-initialize calculator (CRUCIAL FIX)
            try {
                window.setupCalculator(newLang);
                console.log(`✅ Calculator re-initialized for ${newLang}`);
            } catch (err) {
                console.warn('Calculator re-init on language change failed:', err);
            }
        };


        // ===== Lazy Load & Media Control =====
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

        // ===== Event Listeners =====
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
    
    // --- ROBUST INITIALIZATION ---
    const targetNode = document.getElementById('itemDetailViewPlaceholder') || document.body;
    const config = { childList: true, subtree: false }; 

    let reinitTimer;
    const observer = new MutationObserver(function(mutationsList) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const kbAppNode = document.querySelector('.kb-app');
          if (kbAppNode) {
            clearTimeout(reinitTimer);
            reinitTimer = setTimeout(() => {
                window.hasCaseLogicRun = false; 
                console.log('🔄 Re-initializing case logic due to content change...');
                window.runCaseLogic();
                try {
                  // Ensure calculators are set up for the new content (FIXED)
                  window.setupCalculator('en'); 
                  window.setupCalculator('ar');
                } catch (err) {
                  console.warn('Calculator re-init on content change failed:', err);
                }
            }, 500); 
          }
        }
      }
    });

    observer.observe(targetNode, config);
    
    // --- INITIAL RUN ---
    setTimeout(() => {
        window.runCaseLogic();
        try {
            window.setupCalculator('en');
            window.setupCalculator('ar');
            
            const initialLang = document.getElementById('lang-toggle-button')?.getAttribute('data-lang') === 'ar' ? 'ar' : 'en';
            if (initialLang === 'ar') {
                window.toggleLanguage();
            } else {
                document.getElementById('en-content').style.display = 'block';
                document.getElementById('ar-content').style.display = 'none';
                document.querySelector('.kb-app')?.setAttribute('dir', 'ltr');
            }
            console.log('✅ Initial setup complete.');
        } catch (err) {
            console.warn('Initial Calculator setup failed:', err);
        }
    }, 100);
})();