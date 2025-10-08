// ===================================
// 1. Lightbox / Modal Logic
// ===================================

/**
 * يفتح النافذة المنبثقة (الـ Lightbox) بناءً على الـ ID الخاص بها
 * @param {string} targetId - هو ID النافذة المنبثقة (مثل: 'lb-slot')
 */
function openLightbox(targetId) {
    const lightbox = document.getElementById(targetId);
    if (lightbox) {
        lightbox.classList.add('active');
        // منع التمرير على جسم الصفحة عند فتح النافذة المنبثقة
        document.body.style.overflow = 'hidden';
    }
}

/**
 * يغلق النافذة المنبثقة
 * @param {string} targetId - هو ID النافذة المنبثقة (مثل: 'lb-slot')
 */
function closeLightbox(targetId) {
    const lightbox = document.getElementById(targetId);
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===================================
// 2. Language Switch Logic
// ===================================

/**
 * تبديل عرض المحتوى بين العربية والإنجليزية
 * @param {string} lang - اللغة المراد التحويل إليها ('ar' أو 'en')
 */
function switchLanguage(lang) {
    const arContent = document.getElementById('ar-content');
    const enContent = document.getElementById('en-content');
    const langToggle = document.getElementById('lang-toggle-button');
    const appWrapper = document.querySelector('.kb-app');

    if (!arContent || !enContent || !langToggle || !appWrapper) return;

    if (lang === 'ar') {
        // إظهار العربية، إخفاء الإنجليزية، ضبط الاتجاه لليمين (RTL)
        arContent.style.display = 'block';
        enContent.style.display = 'none';
        appWrapper.setAttribute('dir', 'rtl');
        langToggle.textContent = 'Switch to English';
        langToggle.setAttribute('data-lang', 'en'); // اللغة القادمة عند الضغط
    } else {
        // إظهار الإنجليزية، إخفاء العربية، ضبط الاتجاه لليسار (LTR)
        arContent.style.display = 'none';
        enContent.style.display = 'block';
        appWrapper.setAttribute('dir', 'ltr');
        langToggle.textContent = 'التحويل للعربية';
        langToggle.setAttribute('data-lang', 'ar'); // اللغة القادمة عند الضغط
    }
}


// ===================================
// 3. Initialization and Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', () => {

    // -----------------
    // Language Toggle Init
    // -----------------
    const langToggle = document.getElementById('lang-toggle-button');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            // الحصول على اللغة المراد التحويل إليها من خاصية data-lang
            const currentTargetLang = langToggle.getAttribute('data-lang');
            switchLanguage(currentTargetLang);
        });
        
        // ضبط الحالة الأولية: عرض العربية واجهةً
        switchLanguage('ar');
    }

    // -----------------
    // Lightbox Event Listeners Init
    // -----------------

    // إضافة مستمعي الأحداث لأزرار الإغلاق والـ Overlay لإغلاق النافذة
    document.querySelectorAll('.lightbox-close, .lightbox-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            // البحث عن أقرب lightbox للعنصر المضغوط عليه
            const lightbox = e.target.closest('.css-lightbox');
            if (lightbox) {
                closeLightbox(lightbox.id);
            }
        });
    });

});