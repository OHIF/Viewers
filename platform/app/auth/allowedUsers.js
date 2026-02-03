import { supabase } from './supabaseClient';

export async function isUserAllowed(email) {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return false;
  }

  if (!data.paid) {
    return false;
  }

  if (data.expires_at && new Date(data.expires_at) <= new Date()) {
    return false;
  }

  return true;
}
