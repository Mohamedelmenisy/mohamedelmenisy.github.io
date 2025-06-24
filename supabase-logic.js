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
