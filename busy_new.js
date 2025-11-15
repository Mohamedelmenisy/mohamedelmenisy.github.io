/*
  Unified script for InfiniBase Cases - Final Corrected Version
  - Handles language toggling correctly by showing/hiding content divs.
  - Manages lightboxes for images and videos with improved performance.
  - Efficiently loads media using Intersection Observer.
*/

(function () {
    'use strict';
    
    // متغير عام لتتبع الـ lightbox المفتوح حاليًا
    let currentLightbox = null;
    const APP_SELECTOR = '.kb-app';

    // =======================================================
    // ================ LANGUAGE TOGGLE LOGIC (Corrected) ====
    // =======================================================
    
    /**
     * هذه هي الدالة الجديدة والصحيحة لتبديل اللغة.
     * تبحث عن زر اللغة وقسمي المحتوى وتقوم بتبديل الظهور بينهما.
     */
    function setupLanguageToggle() {
        const langToggleButton = document.getElementById('lang-toggle-button');
        const arContent = document.getElementById('ar-content');
        const enContent = document.getElementById('en-content');

        // نتوقف إذا كانت أي من العناصر المطلوبة غير موجودة لتجنب الأخطاء
        if (!langToggleButton || !arContent || !enContent) {
            console.warn('Language toggle elements not found. Make sure #lang-toggle-button, #ar-content, and #en-content exist.');
            return;
        }

        // هذه هي الدالة التي سيتم تنفيذها عند الضغط على الزر
        const handleLanguageSwitch = () => {
            // نتحقق مما إذا كان المحتوى الإنجليزي ظاهرًا حاليًا
            const isEnglishVisible = enContent.style.display !== 'none';

            if (isEnglishVisible) {
                // إذا كان الإنجليزي ظاهرًا، نقوم بالتحويل إلى العربية
                enContent.style.display = 'none';
                arContent.style.display = 'block';
                langToggleButton.innerHTML = '<i class="fas fa-language"></i> Switch to English';
            } else {
                // إذا كان العربي ظاهرًا، نقوم بالتحويل إلى الإنجليزية
                arContent.style.display = 'none';
                enContent.style.display = 'block';
                langToggleButton.innerHTML = '<i class="fas fa-language"></i> التحويل للعربية';
            }
            // الانتقال لأعلى الصفحة بسلاسة بعد تغيير اللغة
            window.scrollTo({ top: 0, behavior: "smooth" });
        };
        
        // لمنع إضافة المستمع أكثر من مرة (في حال تم استدعاء الدالة عدة مرات)
        // نقوم بإزالة المستمع القديم أولاً ثم نضيفه من جديد
        langToggleButton.removeEventListener('click', handleLanguageSwitch);
        langToggleButton.addEventListener('click', handleLanguageSwitch);
    }

    // =======================================================
    // ================= LIGHTBOX FUNCTIONS ==================
    // =======================================================
    
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        
        currentLightbox = lb;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // تشغيل الفيديو (إذا وجد) عند فتح الـ lightbox
        const video = lb.querySelector('video');
        if (video && typeof video.play === 'function') {
            video.currentTime = 0;
            video.play().catch(() => {});
        }
        
        // إضافة focus trapping لتحسين الوصول
        const focusableElements = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    };

    window.closeLightbox = function (targetId) {
        const lb = targetId ? document.getElementById(targetId) : currentLightbox;
        if (!lb) return;
        
        lb.classList.remove('active');
        document.body.style.overflow = '';
        
        // إيقاف الفيديو (إذا وجد) عند إغلاق الـ lightbox
        const video = lb.querySelector('video');
        if (video && typeof video.pause === 'function') {
            video.pause();
        }
        
        currentLightbox = null;
    };

    // =======================================================
    // ================= MEDIA LOADING =======================
    // =======================================================
    
    function loadAllMedia() {
        const allMedia = document.querySelectorAll(`${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`);
        
        // إذا لم يدعم المتصفح Intersection Observer، نستخدم الطريقة التقليدية
        if (!('IntersectionObserver' in window)) {
            allMedia.forEach(media => {
                if (media.src) return;
                const dataSrc = media.getAttribute('data-src');
                if (dataSrc) {
                    media.src = dataSrc;
                    media.removeAttribute('data-src');
                }
            });
            return;
        }
        
        const mediaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const media = entry.target;
                    const dataSrc = media.getAttribute('data-src');
                    
                    if (dataSrc) {
                        media.src = dataSrc;
                        media.removeAttribute('data-src');
                        mediaObserver.unobserve(media);
                    }
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.1 });
        
        allMedia.forEach(media => {
            if (media.src) return;
            mediaObserver.observe(media);
        });
    }

    // =======================================================
    // ================ MAIN INITIALIZATION ==================
    // =======================================================

    /**
     * هذه هي الدالة الرئيسية التي يتم استدعاؤها من ملف HTML الرئيسي.
     * تقوم بتشغيل كل الوظائف اللازمة عند عرض Case جديد.
     */
    function initBusyNew() {
        // 1. تفعيل زر تبديل اللغة
        setupLanguageToggle();

        // 2. تحميل الصور والفيديوهات بأسلوب lazy-load
        loadAllMedia();
    }

    // نجعل الدالة الرئيسية متاحة بشكل عام ليتمكن ملف HTML من الوصول إليها
    // هذا هو السطر الذي يربط بين الملفين
    window.initBusyNew = initBusyNew;

    // =======================================================
    // ================== GLOBAL EVENT LISTENERS =============
    // =======================================================
    
    document.addEventListener('click', function (e) {
        const target = e.target;
        
        // --- إغلاق الـ Lightbox ---
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

        // --- التمرير الناعم للروابط الداخلية وفتح الـ lightbox ---
        const anchor = target.closest('a[href^="#"]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            
            try {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    // إذا كان العنصر المستهدف هو lightbox، نفتحه
                    if (targetElement.classList.contains('css-lightbox')) {
                        openLightbox(targetElement.id);
                    } else {
                        // إذا كان عنصر عادي، ننتقل إليه بسلاسة
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            } catch (err) {
                console.error("Could not scroll to anchor:", err);
            }
            return;
        }
    });
    
    // --- إغلاق الـ lightbox عند الضغط على مفتاح ESC ---
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && currentLightbox) {
            closeLightbox();
        }
    });

})();
