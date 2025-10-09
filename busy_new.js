/*
  Unified script for InfiniBase Cases - v5 (Stable - Optimized Observer)
  - FIX: Replaced aggressive MutationObserver with a smarter, debounced version to prevent infinite loops and improve performance.
  - FIX: runCaseLogic and setupCalculator are now globally accessible (window.X) to fix "is not defined" error in observer and toggle.
  - Calculators are re-initialized immediately after language switch, no refresh needed.
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
    // FIX: Define on window object to make it globally accessible by the observer
    window.runCaseLogic = function() {
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
            // FIX: Removed scrollIntoView; CSS now handles perfect centering.
        };

        window.closeLightbox = function (targetId) {
            const lb = document.getElementById(targetId);
            if (!lb) return;
            lb.classList.remove('active');
            // FIX: Only re-enable scroll if no other lightbox is active
            if (!document.querySelector('.css-lightbox.active')) {
                document.body.style.overflow = '';
            }
            
            const video = lb.querySelector('video');
            if (video && typeof video.pause === 'function') {
                video.pause();
            }
        };
        
        // ===== Lazy Loading for Media =====
        function lazyLoadMedia() {
            const lazyMedia = document.querySelectorAll(`${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`);
            if ('IntersectionObserver' in window) {
                const mediaObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const media = entry.target;
                            const src = media.getAttribute('data-src');
                            if (src) {
                                media.src = src;
                                media.removeAttribute('data-src');
                                if (media.tagName === 'VIDEO') media.load();
                            }
                            observer.unobserve(media);
                        }
                    });
                });
                lazyMedia.forEach(media => mediaObserver.observe(media));
            } else {
                lazyMedia.forEach(media => {
                    const src = media.getAttribute('data-src');
                    if (src) {
                        media.src = src;
                        media.removeAttribute('data-src');
                    }
                });
            }
        }
        
        // ===== Language Toggle Function =====
        window.toggleLanguage = function() { // Made globally accessible
          const button = document.getElementById("lang-toggle-button");
          const appWrapper = document.querySelector(APP_SELECTOR);
          if (!button || !appWrapper) return;

          const isArabicActive = appWrapper.getAttribute('dir') === 'rtl';
          if (isArabicActive) {
            appWrapper.setAttribute('dir', 'ltr');
            button.textContent = "التحويل للعربية";
          } else {
            appWrapper.setAttribute('dir', 'rtl');
            button.textContent = "Switch to English";
          }
          
          // FIX: Re-initialize calculators after a short delay to ensure the DOM is updated.
          setTimeout(() => {
              window.setupCalculator('en');
              window.setupCalculator('ar');
          }, 50);
        }

        // ===== Event Listeners and Initial Setup =====
        function setupEventListeners() {
            // Lightbox close listeners
            document.querySelectorAll('.css-lightbox').forEach(lb => {
                // Ensure click on overlay or close button works
                lb.addEventListener('click', (e) => {
                    if (e.target.classList.contains('lightbox-overlay') || e.target.classList.contains('lightbox-close')) {
                        window.closeLightbox(lb.id);
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
            
            // Visual Guide Toggle (If element exists)
            document.querySelectorAll('.toggle-visual').forEach(btn => {
                if (!btn.hasAttribute('data-listeners-set')) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetSelector = btn.getAttribute('data-target-selector');
                        const target = document.querySelector(targetSelector);
                        if (target) {
                            target.style.display = target.style.display === 'block' ? 'none' : 'block';
                            btn.textContent = target.style.display === 'block' ? 
                                (btn.getAttribute('data-lang-close') || 'إخفاء العرض المرئي ▲') : 
                                (btn.getAttribute('data-lang-open') || 'عرض مرئي للإجراء ▼');
                        }
                    });
                    btn.setAttribute('data-listeners-set', 'true');
                }
            });
            
            // Anchor Links Smooth Scroll (Added to prevent conflicts)
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    const href = this.getAttribute('href');
                    if (href.length > 1 && !document.querySelector(`.css-lightbox${href}`)) { // Exclude lightbox links
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });
        }
        
        // ===== Initial Run of Logic =====
        setupEventListeners();
        lazyLoadMedia();
        
        window.hasCaseLogicRun = true;
    }
    // --- End of Core Logic ---

    // ===== Delay Calculator Logic (Compensation Case) - Made Global =====
    // FIX: Define on window object to make it globally accessible by the observer
    window.setupCalculator = function(lang) {
        const langSuffix = lang === 'ar' ? 'Ar' : 'En';
        const estInput = document.getElementById(`estTimeInput${langSuffix}`);
        if (!estInput) return; 

        const actInput = document.getElementById(`actTimeInput${langSuffix}`);
        const orderTypeRadios = document.querySelectorAll(`input[name="orderType${langSuffix}"]`);
        const recommendationBox = document.getElementById(`recommendationBox${langSuffix}`);
        const recommendationTextElem = document.getElementById(`recommendationText${langSuffix}`);
        const copyBtn = document.getElementById(`copyBtn${langSuffix}`);
        
        // CRUCIAL FIX: Ensure listeners are reset before adding them again
        // We use a general selector to find ALL calculator inputs/radios
        const inputsToMonitor = [estInput, actInput, ...Array.from(orderTypeRadios)];
        
        // This is a simple flag to ensure the core logic runs only once per calculator instance
        if (copyBtn && copyBtn.dataset.initialized === 'true') {
            // If already initialized, we simply re-run the calculation, don't re-add listeners
            // This is safer than the original check which prevented re-initialization entirely.
        } else if (copyBtn) {
            copyBtn.dataset.initialized = 'true';
        } else {
            return; // Exit if necessary elements are missing
        }

        let currentRecommendationText = '';
        if (recommendationTextElem) recommendationTextElem.parentElement.classList.add('info');

        const calculateDelay = () => {
            const estTime = estInput.value;
            const actTime = actInput.value;
            if (!estTime || !actTime) return;

            const orderTypeEl = document.querySelector(`input[name="orderType${langSuffix}"]:checked`);
            if (!orderTypeEl) return; 
            const orderType = orderTypeEl.value;

            // ... (Rest of calculation logic remains the same) ...
            const time1 = new Date(`1970-01-01T${estTime}:00`);
            const time2 = new Date(`1970-01-01T${actTime}:00`);
            const diffMins = Math.round((time2 - time1) / 60000);
            
            let message = '', rawMessage = '', boxClass = 'info';

            if (diffMins < 0) {
                message = lang === 'en' ? '<strong>Error:</strong> Actual time cannot be before estimated time.'
                    : '<strong>خطأ:</strong> الوقت الفعلي لا يمكن أن يكون قبل الوقت المتوقع.';
                boxClass = 'error';
                rawMessage = 'Error: Invalid time input.';
            } else if (diffMins <= 15) {
                message = lang === 'en' ?
                    `<strong>Delay: ${diffMins} mins.</strong> An apology is sufficient.` : `<strong>مدة التأخير: ${diffMins} دقيقة.</strong> يكتفى بالاعتذار للعميل.`;
                boxClass = 'info';
                rawMessage = `Delay of ${diffMins} mins. Apologized. No compensation.`;
            } else {
                boxClass = 'success';
                if (orderType === 'fast') {
                    if (diffMins <= 30) {
                        message = lang === 'en' ? 'Compensate: <strong>Delivery Fees only</strong>.'
                            : 'التعويض: <strong>رسوم التوصيل فقط</strong>.';
                        rawMessage = 'Compensated with Delivery Fees only.';
                    } else if (diffMins <= 45) {
                        message = lang === 'en' ? 'Compensate: <strong>Delivery + 25% of chef total</strong>.'
                            : 'التعويض: <strong>التوصيل + 25% من قيمة الطلب</strong>.';
                        rawMessage = 'Compensated with Delivery + 25% of chef total.';
                    } else if (diffMins <= 60) {
                        message = lang === 'en' ? 'Compensate: <strong>Delivery + 50% of chef total</strong>.'
                            : 'التعويض: <strong>التوصيل + 50% من قيمة الطلب</strong>.';
                        rawMessage = 'Compensated with Delivery + 50% of chef total.';
                    } else {
                        message = lang === 'en' ? 'Compensate: <strong>Delivery + Full order value</strong>.'
                            : 'التعويض: <strong>التوصيل + كامل قيمة الطلب</strong>.';
                        rawMessage = 'Compensated with Delivery + Full order value.';
                    }
                } else if (orderType === 'scheduled') {
                    if (diffMins <= 60) {
                        message = lang === 'en' ? 'Compensate: <strong>25% of order total</strong>.'
                            : 'التعويض: <strong>25% من إجمالي قيمة الطلب</strong>.';
                        rawMessage = 'Compensated with 25% of order total.';
                    } else if (diffMins <= 90) {
                        message = lang === 'en' ? 'Compensate: <strong>50% of order total</strong>.'
                            : 'التعويض: <strong>50% من إجمالي قيمة الطلب</strong>.';
                        rawMessage = 'Compensated with 50% of order total.';
                    } else {
                        message = lang === 'en' ? 'Compensate: <strong>Full order value</strong>.'
                            : 'التعويض: <strong>كامل قيمة الطلب</strong>.';
                        rawMessage = 'Compensated with Full order value.';
                    }
                }
            }

            // Update UI
            if (recommendationBox) {
                recommendationBox.className = `recommendation-box ${boxClass}`;
                recommendationBox.querySelector('p').innerHTML = message;
                currentRecommendationText = rawMessage;
            }
        };
        
        // Add listeners ONLY if the calculator is being initialized for the first time
        if (copyBtn.dataset.listenersSet !== 'true') {
            inputsToMonitor.forEach(input => {
                input.addEventListener('input', calculateDelay);
            });
            
            // Copy Button Logic
            copyBtn.addEventListener('click', () => {
                const tempTextarea = document.createElement('textarea');
                tempTextarea.value = currentRecommendationText;
                document.body.appendChild(tempTextarea);
                tempTextarea.select();
                document.execCommand('copy');
                document.body.removeChild(tempTextarea);

                // Quick visual feedback
                const originalText = copyBtn.textContent;
                copyBtn.textContent = lang === 'en' ? 'Copied!' : 'تم النسخ!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 1000);
            });

            copyBtn.dataset.listenersSet = 'true';
        }

        // Run initial calculation
        calculateDelay();
    }
    // --- End of Calculator Logic ---
    
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
                window.runCaseLogic(); // FIX: Call via window
                try {
                  // Ensure calculators are set up for the new content
                  window.setupCalculator('en'); // FIX: Call via window
                  window.setupCalculator('ar'); // FIX: Call via window
                } catch (err) {
                  console.warn('Calculator re-init on content change failed:', err);
                }
            }, 500); // Debounce to prevent rapid firing
          }
        }
      }
    });

    observer.observe(targetNode, config);
    
    // --- Initial Run ---
    document.addEventListener('DOMContentLoaded', () => {
        window.runCaseLogic(); // FIX: Call via window
        try {
            window.setupCalculator('en'); // FIX: Call via window
            window.setupCalculator('ar'); // FIX: Call via window
        } catch (err) {
            console.warn('Initial Calculator setup failed:', err);
        }
        
        // Initial language setup based on the button's data attribute
        const langButton = document.getElementById('lang-toggle-button');
        if (langButton) {
            const initialLang = langButton.getAttribute('data-lang');
            const appWrapper = document.querySelector('.kb-app');
            if (appWrapper) {
                appWrapper.setAttribute('dir', initialLang === 'ar' ? 'rtl' : 'ltr');
            }
        }
    });
})();
