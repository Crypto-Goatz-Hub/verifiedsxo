import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/login?error=missing_code');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wsuifaedzwyorhjqzlot.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return res.redirect('/');
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.redirect('/login?error=auth_failed');
  }
}
