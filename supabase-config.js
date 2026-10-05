/* SurakshaCare Supabase configuration.
   Replace the two placeholder values with the Project URL and Publishable key
   from your Supabase project. Never put a service_role/secret key here. */
window.SURAKSACARE_SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
window.SURAKSACARE_SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

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
