/*
  Unified script for InfiniBase Cases - v3 (Stable)
  - NEW: Persistent MutationObserver to handle content reloads/refreshes reliably.
  - Smarter anchor link scrolling to prevent conflicts.
  - Handles language toggling without needing a refresh.
  - Manages lightboxes for images and videos, ensuring they center correctly.
  - Controls visual guide section visibility.
  - Powers the interactive delay calculator (if present).
  - Lazy loads all media elements.
*/

(function () {
    // A flag to prevent the logic from running multiple times on the same content
    window.hasCaseLogicRun = window.hasCaseLogicRun || false;

    // --- Start of Core Logic ---
    function runCaseLogic() {
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
            // Center the lightbox on open
            lb.scrollIntoView({ behavior: "instant", block: "center" });
        };

        window.closeLightbox = function (targetId) {
            const lb = document.getElementById(targetId);
            if (!lb) return;
            lb.classList.remove('active');
            document.body.style.overflow = '';
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
        function toggleLanguage() {
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
          // No scroll needed, just re-aligns content
        }

        // ===== Delay Calculator Logic (Compensation Case) =====
        function setupCalculator(lang) {
            const langSuffix = lang === 'ar' ? 'Ar' : 'En';
            const estInput = document.getElementById(`estTimeInput${langSuffix}`);
            if (!estInput) return; // If calculator is not on the page, exit immediately

            const actInput = document.getElementById(`actTimeInput${langSuffix}`);
            const orderTypeRadios = document.querySelectorAll(`input[name="orderType${langSuffix}"]`);
            const recommendationBox = document.getElementById(`recommendationBox${langSuffix}`);
            const recommendationTextElem = document.getElementById(`recommendationText${langSuffix}`);
            const copyBtn = document.getElementById(`copyBtn${langSuffix}`);

            if (!actInput || !recommendationBox || !copyBtn) return;

            let currentRecommendationText = '';
            if (recommendationTextElem) recommendationTextElem.parentElement.classList.add('info');

            const calculateDelay = () => {
                const estTime = estInput.value;
                const actTime = actInput.value;
                if (!estTime || !actTime) return;

                const orderType = document.querySelector(`input[name="orderType${langSuffix}"]:checked`).value;
                const time1 = new Date(`1970-01-01T${estTime}:00`);
                const time2 = new Date(`1970-01-01T${actTime}:00`);
                const diffMins = Math.round((time2 - time1) / 60000);

                let message = '', rawMessage = '', boxClass = 'info';

                if (diffMins < 0) {
                    message = lang === 'en' ? '<strong>Error:</strong> Actual time cannot be before estimated time.' : '<strong>خطأ:</strong> الوقت الفعلي لا يمكن أن يكون قبل الوقت المتوقع.';
                    boxClass = 'error'; rawMessage = 'Error: Invalid time input.';
                } else if (diffMins <= 15) {
                    message = lang === 'en' ? `<strong>Delay: ${diffMins} mins.</strong> An apology is sufficient.` : `<strong>مدة التأخير: ${diffMins} دقيقة.</strong> يكتفى بالاعتذار للعميل.`;
                    boxClass = 'info'; rawMessage = `Delay of ${diffMins} mins. Apologized. No compensation.`;
                } else {
                    boxClass = 'success';
                    if (orderType === 'fast') {
                        if (diffMins <= 30) { message = lang === 'en' ? 'Compensate: <strong>Delivery Fees only</strong>.' : 'التعويض: <strong>رسوم التوصيل فقط</strong>.'; rawMessage = 'Compensated with Delivery Fees only.'; }
                        else if (diffMins <= 45) { message = lang === 'en' ? 'Compensate: <strong>Delivery + 25% of chef total</strong>.' : 'التعويض: <strong>التوصيل + 25% من قيمة الطلب</strong>.'; rawMessage = 'Compensated with Delivery + 25% of chef total.'; }
                        else if (diffMins <= 60) { message = lang === 'en' ? 'Compensate: <strong>Delivery + 50% of chef total</strong>.' : 'التعويض: <strong>التوصيل + 50% من قيمة الطلب</strong>.'; rawMessage = 'Compensated with Delivery + 50% of chef total.'; }
                        else { message = lang === 'en' ? 'Compensate: <strong>Full Order Amount</strong>.' : 'التعويض: <strong>كامل قيمة الطلب</strong>.'; rawMessage = 'Compensated with Full Order Amount.'; }
                    } else { // Scheduled
                        if (diffMins <= 60) { message = lang === 'en' ? 'Compensate: <strong>50% to 100% of the order</strong>.' : 'التعويض: <strong>50% إلى 100% من قيمة الطلب</strong>.'; rawMessage = 'Compensated with 50%-100% of order.'; }
                        else { message = lang === 'en' ? 'Compensate: <strong>Full Amount + 50 SAR credit</strong>.' : 'التعويض: <strong>كامل المبلغ + 50 ريال كرصيد</strong>.'; rawMessage = 'Compensated with Full Amount + 50 SAR.'; }
                    }
                }
                if(recommendationTextElem) recommendationTextElem.innerHTML = message;
                currentRecommendationText = rawMessage;
                if(recommendationBox) {
                    recommendationBox.className = 'recommendation-box';
                    recommendationBox.classList.add(boxClass);
                }
            };

            [estInput, actInput, ...orderTypeRadios].forEach(el => el.addEventListener('input', calculateDelay));
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(currentRecommendationText).then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = lang === 'en' ? 'Copied!' : 'تم النسخ!';
                    setTimeout(() => { copyBtn.innerHTML = originalText; }, 1500);
                });
            });
        }

        function init() {
            lazyLoadMedia();
            setupCalculator('en');
            setupCalculator('ar');
        }

        init(); // Run all setup functions

        document.body.addEventListener('click', function (e) {
            const target = e.target;
            
            if (target.closest('#lang-toggle-button')) {
                toggleLanguage();
                return;
            }

            const toggleBtn = target.closest('.toggle-visual');
            if (toggleBtn) {
                const guide = toggleBtn.nextElementSibling;
                if (guide && guide.classList.contains('visual-guide')) {
                    const isHidden = guide.style.display === 'none' || guide.style.display === '';
                    guide.style.display = isHidden ? (guide.classList.contains('image-grid-2') ? 'grid' : 'block') : 'none';
                    if (isHidden) guide.scrollIntoView({ behavior:'smooth', block: 'center' });
                }
                return;
            }

            const overlay = target.closest('.lightbox-overlay');
            const closeBtn = target.closest('.lightbox-close');
            if(overlay || closeBtn) {
                const lb = target.closest('.css-lightbox');
                if (lb && lb.id) {
                    closeLightbox(lb.id);
                    e.preventDefault();
                }
                return;
            }
            
            const anchor = target.closest('a[href^="#"]');
            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href.length > 1 && document.getElementById(href.substring(1))) {
                    try {
                        const targetElement = document.querySelector(href);
                        if (targetElement) {
                            e.preventDefault();
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    } catch (err) {}
                }
            }
            
        }, true);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape") {
                 const activeLightbox = document.querySelector('.css-lightbox.active');
                 if(activeLightbox) closeLightbox(activeLightbox.id);
            }
        });
        
        window.hasCaseLogicRun = true;
    }
    // --- End of Core Logic ---


    // --- ROBUST INITIALIZATION ---
    // This watches for when the main content container is added to the page
    const targetNode = document.getElementById('itemDetailViewPlaceholder') || document.body;
    const config = { childList: true, subtree: true };

    const observer = new MutationObserver(function(mutationsList, observer) {
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const kbAppNode = document.querySelector('.kb-app');
                if (kbAppNode) {
                    // Reset the flag if the kb-app node is detected
                    window.hasCaseLogicRun = false;
                    runCaseLogic();
                    // We don't disconnect, it will re-run if content is replaced (e.g., navigating to another case)
                }
            }
        }
    });

    observer.observe(targetNode, config);

})();
