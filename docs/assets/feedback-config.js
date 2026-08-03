/*
 * Public browser configuration for the shared prototype feedback database.
 *
 * The Supabase Project URL and sb_publishable_... key are designed to be
 * visible in browser source. Never place a secret or service-role key here.
 */
window.MMC_FEEDBACK_CONFIG = {
  supabaseUrl: 'https://pggexytlujolpvifniqy.supabase.co',
  supabasePublishableKey: 'sb_publishable_9sSQcAhDsgyZ0HqQcYJuMw_Hm3Ocl1y',
  table: 'prototype_comments',
  pollIntervalMs: 15000
};
