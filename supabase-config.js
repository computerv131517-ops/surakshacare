/* SurakshaCare Supabase configuration.
   Replace the two placeholder values with the Project URL and Publishable key
   from your Supabase project. Never put a service_role/secret key here. */
window.SURAKSACARE_SUPABASE_URL = "https://vppjjefyfspzjojjmeyb.supabase.co";
window.SURAKSACARE_SUPABASE_KEY = "sb_publishable_LS_ia1mKq782Tsz6yIeapw_ym0Juccy";
window.surakshaSupabaseReady = false;
window.surakshaSupabase = null;

(function initSurakshaSupabase(){
  if (!window.supabase || !window.SURAKSACARE_SUPABASE_URL.startsWith("https://") || window.SURAKSACARE_SUPABASE_KEY.includes("YOUR_")) return;
  window.surakshaSupabase = window.supabase.createClient(
    window.SURAKSACARE_SUPABASE_URL,
    window.SURAKSACARE_SUPABASE_KEY
  );
  window.surakshaSupabaseReady = true;
})();
