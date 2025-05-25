// js/supabase.js
const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co'; // استخدم الـ URL الخاص بك
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4'; // استخدم مفتاح ANON الخاص بك

// 'supabase' هنا يشير إلى الكائن العام من مكتبة Supabase CDN
if (typeof supabase === 'undefined' || typeof supabase.createClient === 'undefined') {
    console.error("Supabase client library (from CDN) not found. Make sure it's loaded BEFORE supabase.js");
    // يمكنك اختيار إما رمي خطأ لمنع app.js من الاستمرار بدون عميل،
    // أو تصدير null والسماح لـ app.js بالتعامل مع ذلك (وهو ما يفعله الكود الحالي بالفعل).
    // الطريقة الأفضل هي رمي خطأ إذا كان Supabase ضروريًا.
    // export const supabaseClient = null; //  app.js سيتحقق من هذا
    throw new Error("Supabase client library (CDN) is required but not loaded.");
}

// قم بتصدير العميل المهيأ باسم مختلف، على سبيل المثال 'supabaseClient'
export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
