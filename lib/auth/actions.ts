/**
 * Auth action helpers — server actions for sign in/up/out.
 * These run on the server. Never expose service-role key here.
 * Uses anon key client with auth session cookies.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/env';

export async function signIn(formData: FormData) {
  if (isDemoMode()) {
    redirect('/profile?demo=1');
  }

  const supabase = await createClient();
  if (!supabase) redirect('/profile?demo=1');

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/profile');
}

export async function signUp(formData: FormData) {
  if (isDemoMode()) {
    redirect('/profile?demo=1');
  }

  const supabase = await createClient();
  if (!supabase) redirect('/profile?demo=1');

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&tab=signup`);
  }

  redirect('/login?message=Check+your+email+to+confirm+your+account');
}

export async function signOut() {
  if (isDemoMode()) {
    redirect('/');
  }

  const supabase = await createClient();
  if (!supabase) redirect('/');

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
