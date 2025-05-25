// js/app.js
import { supabase } from './supabase.js'; // استيراد العميل من supabase.js

// --- Global Variables & Constants ---
const USER_DATA_KEY = 'infiniBaseUserData'; // لتخزين بيانات المستخدم محليًا

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[app.js] DOMContentLoaded fired.');

    // --- Initial Checks ---
    if (!supabase) {
        console.error("[app.js] CRITICAL: Supabase client is not available. Halting application.");
        document.body.innerHTML = '<p style="color:red;text-align:center;padding:2em;">Application critical error: Backend service not available. Please contact support.</p>';
        return;
    }
    console.log('[app.js] Supabase client loaded successfully.');

    if (typeof kbSystemData === 'undefined') {
        console.error("[app.js] CRITICAL: kbSystemData is not available. Halting application.");
        document.body.innerHTML = '<p style="color:red;text-align:center;padding:2em;">Application critical error: Core data (kbSystemData) not found. Please contact support.</p>';
        return;
    }
    console.log('[app.js] kbSystemData loaded successfully.');


    // --- Authentication & User Handling ---
    let currentUser = null;
    let activeCaseQuillEditor = null; // محرر Quill للحالات

    async function initializeAuthAndUser() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('[app.js] Error getting session:', sessionError.message);
            redirectToLogin(true); // توجيه مع رسالة خطأ
            return null;
        }

        if (!session) {
            console.log('[app.js] No active session, redirecting to login.');
            redirectToLogin();
            return null;
        }

        console.log('[app.js] Active session found for user:', session.user.id);
        // محاولة جلب تفاصيل المستخدم من localStorage أولاً، ثم من Supabase
        let userData = JSON.parse(localStorage.getItem(USER_DATA_KEY));

        if (userData && userData.id === session.user.id) {
            console.log('[app.js] User data found in localStorage:', userData);
            currentUser = userData;
        } else {
            // جلب تفاصيل المستخدم من جدول 'users'
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('id, name, email, role') // تأكد أن لديك عمود 'role'
                .eq('id', session.user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows, not necessarily error if profile not yet created
                console.error('[app.js] Error fetching user profile from DB:', profileError.message);
                // يمكن تسجيل خروج المستخدم أو استخدام دور افتراضي
                // await supabase.auth.signOut();
                // redirectToLogin(true, "Profile error. Please login again.");
                // return null;
                 currentUser = { // استخدام دور افتراضي إذا فشل جلب الملف الشخصي لكن الجلسة موجودة
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    role: 'viewer' // دور افتراضي آمن
                };
                console.warn("[app.js] Using default role 'viewer' due to profile fetch issue.");
            } else if (profile) {
                currentUser = profile;
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
                console.log('[app.js] User profile fetched from DB and cached:', currentUser);
            } else {
                // إذا لم يكن هناك ملف شخصي، قد يكون مستخدمًا جديدًا لم يتم إنشاء سجله في جدول users بعد
                // هذا يجب أن يتم التعامل معه أثناء عملية التسجيل (signup.html)
                console.warn('[app.js] User profile not found in DB for session user. Redirecting to login for re-sync or error.');
                // يمكنك محاولة إنشاء الملف الشخصي هنا إذا لم يكن موجودًا، أو ببساطة إعادة التوجيه
                await supabase.auth.signOut(); // تسجيل الخروج لفرض إعادة مزامنة
                localStorage.removeItem(USER_DATA_KEY);
                redirectToLogin(true, "User profile sync error. Please login again.");
                return null;
            }
        }
        return currentUser;
    }

    function redirectToLogin(sessionExpired = false, message = null) {
        let url = '/infini-base/login.html';
        if (sessionExpired) {
            url += '?session_expired=true';
            if (message) {
                url += '&message=' + encodeURIComponent(message);
            }
        }
        window.location.replace(url);
    }

    currentUser = await initializeAuthAndUser();
    if (!currentUser) {
        // إذا لم يتم تعيين currentUser (بسبب خطأ أو إعادة توجيه)، أوقف تنفيذ باقي السكربت
        console.log("[app.js] Halting further execution as currentUser is not set.");
        return;
    }

    console.log('[app.js] Final Current user with role:', currentUser);

    // --- DOM Elements ---
    // (نفس تعريف عناصر DOM من ردود سابقة)
    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');
    const pageContent = document.getElementById('pageContent');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const accessTrackingReportContainer = document.getElementById('accessTrackingReportContainer');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;
    const logoutButton = document.getElementById('logoutButton');
    const reportErrorBtn = document.getElementById('reportErrorBtn');

    // --- Generic Modal Elements ---
    const genericModal = document.getElementById('genericModal');
    const modalTitleEl = document.getElementById('modalTitle');
    const modalContentEl = document.getElementById('modalContent');
    const modalActionsEl = document.getElementById('modalActions');
    const closeModalBtnGeneric = document.getElementById('closeModalBtn'); // زر الإغلاق للمودال العام

    // --- Case Editor Modal Elements ---
    const caseEditorModal = document.getElementById('caseEditorModal');
    const caseEditorTitle = document.getElementById('caseEditorTitle');
    const caseTitleInput = document.getElementById('caseTitleInput');
    const caseSummaryInput = document.getElementById('caseSummaryInput');
    const caseStatusSelect = document.getElementById('caseStatusSelect');
    const caseTagsInput = document.getElementById('caseTagsInput');
    const caseQuillEditorDiv = document.getElementById('caseQuillEditor'); // الـ div الذي سيحتوي Quill
    const saveCaseButton = document.getElementById('saveCaseButton');
    const caseEditorCaseIdInput = document.getElementById('caseEditorCaseId');
    const caseEditorSectionIdInput = document.getElementById('caseEditorSectionId');


    // --- Initial UI Updates ---
    const userDisplayName = currentUser.name || currentUser.email.split('@')[0];
    if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
    const avatarImg = document.querySelector('#userProfileButton img');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366F1&color=fff&size=36&font-size=0.45&rounded=true`;
        avatarImg.alt = userDisplayName;
    }
    if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;


    if (kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    }

    // --- Helper & Core Functions (showToast, Modal, Theme, Card Renderers, etc.) ---
    // (انسخ الدوال المساعدة من الردود السابقة: escapeHTML, highlightText, truncateText, showToast, getThemeColors)
    // (انسخ دوال العرض: renderArticleCard_enhanced, renderItemCard_enhanced, renderCaseCard_enhanced)
    // (انسخ دوال الـ Modal العامة: openModal, closeModal - مع تعديل closeModalBtnGeneric)
    // ... (هذه الدوال موجودة في الردود السابقة، قم بنسخها هنا)

    // --- Event Listeners (Logout, Theme, Report Error) ---
    // (نفس كود event listeners من الردود السابقة)
    // ...

    // --- Case Editor Functions ---
    function initializeCaseStatusOptions() {
        if (caseStatusSelect && typeof caseStatusOptions !== 'undefined' && caseStatusOptions.length > 0) {
            caseStatusSelect.innerHTML = caseStatusOptions.map(s => `<option value="${s}">${s}</option>`).join('');
        } else if (caseStatusSelect) {
            // خيارات افتراضية إذا لم يتم تحميل caseStatusOptions
            ['New', 'In Progress', 'Resolved', 'Closed'].forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                caseStatusSelect.appendChild(option);
            });
        }
    }
    initializeCaseStatusOptions(); // استدعاء لملء خيارات الحالة عند التحميل

    window.openCaseEditor = async (sectionId, caseIdToEdit = null) => { // جعلها متاحة عالميًا
        if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
            showToast("You do not have permission to manage cases.", "error");
            return;
        }
        currentSectionForCase = sectionId; // متغير عام لتخزين القسم الحالي للكيس
        caseEditorSectionIdInput.value = sectionId;

        if (caseIdToEdit) {
            caseEditorTitle.textContent = "Edit Case";
            caseEditorCaseIdInput.value = caseIdToEdit;
            // جلب بيانات الكيس للتعديل
            const { data: caseData, error } = await supabase.from('cases').select('*').eq('id', caseIdToEdit).single();
            if (error || !caseData) {
                showToast("Error loading case data for editing.", "error");
                console.error("Error loading case for edit:", error);
                return;
            }
            caseTitleInput.value = caseData.title;
            caseSummaryInput.value = caseData.summary;
            caseStatusSelect.value = caseData.status;
            caseTagsInput.value = Array.isArray(caseData.tags) ? caseData.tags.join(', ') : (caseData.tags || '');
            if (!activeCaseQuillEditor) {
                activeCaseQuillEditor = new Quill(caseQuillEditorDiv, { theme: 'snow', modules: { toolbar: [/*...config toolbar...*/] } });
            }
            activeCaseQuillEditor.root.innerHTML = caseData.content || "";
        } else {
            caseEditorTitle.textContent = "Add New Case";
            caseEditorCaseIdInput.value = ""; // مسح ID عند إضافة كيس جديد
            caseTitleInput.value = "";
            caseSummaryInput.value = "";
            caseStatusSelect.value = (typeof caseStatusOptions !== 'undefined' && caseStatusOptions.length > 0) ? caseStatusOptions[0] : 'New';
            caseTagsInput.value = "";
            if (!activeCaseQuillEditor) {
                activeCaseQuillEditor = new Quill(caseQuillEditorDiv, {
                    theme: 'snow',
                    placeholder: 'Enter detailed content, steps, logs etc. Use rich text formatting.',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'blockquote', 'code-block', 'image', 'video'], // إضافة image و video
                            [{ 'script': 'sub'}, { 'script': 'super' }],
                            [{ 'indent': '-1'}, { 'indent': '+1' }],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'align': [] }],
                            ['clean']
                        ]
                    }
                });
            }
            activeCaseQuillEditor.root.innerHTML = ""; // مسح المحرر
        }
        if(caseEditorModal) caseEditorModal.classList.remove('hidden');
    };

    window.closeCaseEditor = () => { // جعلها متاحة عالميًا
        if(caseEditorModal) caseEditorModal.classList.add('hidden');
        // لا تقم بتدمير محرر Quill هنا، فقط امسح محتواه عند فتح المحرر مرة أخرى
    };

    if (saveCaseButton) {
        saveCaseButton.addEventListener('click', async () => {
            const caseId = caseEditorCaseIdInput.value;
            const sectionId = caseEditorSectionIdInput.value;
            const title = caseTitleInput.value.trim();
            const summary = caseSummaryInput.value.trim();
            const status = caseStatusSelect.value;
            const tagsString = caseTagsInput.value.trim();
            const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            const content = activeCaseQuillEditor ? activeCaseQuillEditor.root.innerHTML : "";

            if (!title || !summary || !sectionId) {
                showToast("Title, Summary, and Section are required.", "error");
                return;
            }

            const casePayload = {
                section_id: sectionId,
                title,
                summary,
                content,
                status,
                tags,
                updated_at: new Date().toISOString(),
            };

            let responseData, dbError, actionType;
            saveCaseButton.disabled = true;
            saveCaseButton.textContent = caseId ? "Saving..." : "Adding...";

            try {
                if (caseId) { // تعديل كيس موجود
                    actionType = 'update_case';
                    casePayload.created_by = undefined; // لا نغير created_by عند التعديل
                    const { data, error } = await supabase.from('cases').update(casePayload).eq('id', caseId).select().single();
                    responseData = data; dbError = error;
                } else { // إضافة كيس جديد
                    actionType = 'create_case';
                    casePayload.created_by = currentUser.id; // أو email
                    casePayload.created_at = new Date().toISOString();
                    const { data, error } = await supabase.from('cases').insert(casePayload).select().single();
                    responseData = data; dbError = error;
                }

                if (dbError) throw dbError;

                showToast(`Case successfully ${caseId ? 'updated' : 'added'}!`, 'success');
                closeCaseEditor();

                const itemId = responseData ? responseData.id : null;
                if (itemId) {
                    await supabase.from('activity_log').insert({
                        user_id: currentUser.id, // استخدام user_id بدلاً من email
                        user_email: currentUser.email, // يمكنك الاحتفاظ به إذا أردت
                        action: actionType,
                        item_id: itemId,
                        item_type: 'case',
                        details: { title: title, section: sectionId, status: status }
                    });
                }
                // إعادة تحميل محتوى القسم لإظهار التغييرات
                handleSectionTrigger(sectionId, itemId);
            } catch (err) {
                showToast(`Error saving case: ${err.message}`, 'error');
                console.error("Error saving case:", err);
            } finally {
                saveCaseButton.disabled = false;
                saveCaseButton.textContent = "Save Case";
            }
        });
    }


    // --- Section Navigation & Content Display ---
    // (دالة displaySectionContent مع تعديلات لجلب cases و sub_categories من Supabase وإضافة زر Add Case)
    // (دالة showItemDetailsModal مع تعديلات لجلب case details من Supabase وتسجيل المشاهدة)
    // (دالة handleSectionTrigger و parseHash كما هي تقريبًا)
    // ...
    // [هذه الدوال موجودة في الردود السابقة، قم بدمجها وتعديلها هنا]
    // ...

    // --- Initial Page Load from Hash ---
    // (نفس الكود من الردود السابقة)
    // ...

    console.log('[app.js] All initializations and event listeners are set up.');
});
