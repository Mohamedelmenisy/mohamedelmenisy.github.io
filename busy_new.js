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
*/

(function () {
    // A flag to prevent the logic from running multiple times on the same content
    window.hasCaseLogicRun = window.hasCaseLogicRun || false;

    // --- Start of Core Logic ---
    window.runCaseLogic = function() { // Made globally available for re-initialization
        if (window.hasCaseLogicRun) return; // Exit if logic has already been applied

        const APP_SELECTOR = '.kb-app';

        // ===== Lightbox Functions =====
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
            // Check if any other lightboxes are open before enabling scroll
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

            // 3. Update container direction (FIX: Target the .kb-app container for correct RTL)
            app.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

            // 4. Re-initialize logic if content was replaced/switched
            // This is crucial for elements that might rely on the new language setting
            // Note: Since the core content is just hidden/shown, we only re-run calculators
            
            // Re-initialize logic after language switch (Crucial for calculator)
            window.hasCaseLogicRun = false; 
            // We run the logic again, but since the content is already loaded, it mostly just re-binds events.
            // However, the calculator needs a proper re-initialization outside of runCaseLogic.
            
            try {
                // Ensure calculators are set up for the new language
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
                  // Ensure calculators are set up for the new content
                  // We re-run it for both, the toggle will handle the correct one later
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
    // Delay slightly to ensure full DOM readiness for the first run
    setTimeout(() => {
        window.runCaseLogic();
        // Initial setup for calculator outside of the main runCaseLogic
        try {
            window.setupCalculator('en');
            window.setupCalculator('ar');
            // Determine the initial language and show the content
            const initialLang = document.getElementById('lang-toggle-button')?.getAttribute('data-lang') === 'ar' ? 'ar' : 'en';
            if (initialLang === 'ar') {
                window.toggleLanguage(); // If initial is AR, trigger the toggle to set the AR content and RTL direction
            } else {
                // Set initial content visibility (in case it wasn't done in the HTML)
                document.getElementById('en-content').style.display = 'block';
                document.getElementById('ar-content').style.display = 'none';
            }
            console.log('✅ Initial setup complete.');
        } catch (err) {
            console.warn('Initial Calculator setup failed (This is normal if no calculator is present):', err);
        }
    }, 100);
})();
