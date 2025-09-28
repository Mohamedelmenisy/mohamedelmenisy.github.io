import { supabase } from './supabase.js';

/** ✅ جلب كل المقالات من جدول 'cases' */
export async function fetchArticles() {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data;
}

/** 📝 إضافة تعليق على مقال */
export async function addComment(articleId, commentText, user) {
  const { error } = await supabase.from('kb_comments').insert([{
    item_id: articleId,
    author_id: user.id,
    author_name: user.name,
    body: commentText,
    created_at: new Date().toISOString()
  }]);

  if (error) console.error('Error posting comment:', error);
}

/** ⭐ إرسال تقييم على مقال */
export async function submitFeedback(articleId, rating, reason, user) {
  const { error } = await supabase.from('kb_feedback').insert([{
    item_id: articleId,
    user_id: user.id,
    rating,
    reason,
    created_at: new Date().toISOString()
  }]);

  if (error) console.error('Error submitting feedback:', error);
}

/** 👤 جلب بيانات المستخدم الحالي من جدول 'users' */
export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('No logged in user found:', authError);
    return null;
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}

/** 👀 تسجيل مشاهدة مقال في article_views */
export async function recordArticleView(articleId) {
  const { error } = await supabase.from('article_views').upsert({
    article_id: articleId,
    total_views: 1
  }, {
    onConflict: ['article_id']
  });

  if (error) console.error('Error recording view:', error);
}

/** 🕓 حفظ نسخة من المقال في version_history */
export async function saveVersion(articleId, title, content, user) {
  const { error } = await supabase.from('version_history').insert([{
    item_id: articleId,
    title,
    content,
    author_id: user.id,
    created_at: new Date().toISOString()
  }]);

  if (error) console.error('Error saving version:', error);
}

/** 📋 تسجيل أي نشاط يتم في النظام */
export async function logActivity(user, itemId, itemType, action, details = {}) {
  const { error } = await supabase.from('activity_log').insert([{
    user_id: user.id,
    item_id: itemId,
    item_type: itemType,
    action,
    details,
    timestamp: new Date().toISOString()
  }]);

  if (error) console.error('Error logging activity:', error);
}

/** 📂 جلب التصنيفات من sub_categories */
export async function fetchSubCategories() {
  const { data, error } = await supabase.from('sub_categories').select('*');

  if (error) {
    console.error('Error fetching sub-categories:', error);
    return [];
  }

  return data;
}

/** 📊 جلب تحليلات من v_kb_insights */
export async function fetchInsights() {
  const { data, error } = await supabase.from('v_kb_insights').select('*');

  if (error) {
    console.error('Error fetching insights:', error);
    return [];
  }

  return data;
}
