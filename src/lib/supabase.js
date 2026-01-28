import { createClient } from '@supabase/supabase-js'

// Validate environment variables only in browser environment
let supabase = null;

if (typeof window !== 'undefined') {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Log environment variables for debugging (will be removed in production)
  console.log('Environment variables check:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Present' : '❌ Missing');

  if (!supabaseUrl) {
    console.error('Missing VITE_SUPABASE_URL environment variable. Please add it to your Vercel environment variables.');
  }

  if (!supabaseKey) {
    console.error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please add it to your Vercel environment variables.');
  }

  // Create Supabase client only if both variables are present
  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      supabase = null;
    }
  } else {
    console.warn('Supabase client not initialized due to missing environment variables. Local storage will be used as fallback.');
  }
}

export default supabase