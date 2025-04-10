
// Load environment variables from env.js before the app starts
(function() {
  const envScript = document.createElement('script');
  envScript.src = '/env.js';
  envScript.onerror = function() {
    console.warn('Failed to load environment variables from /env.js');
    // Set default values
    window.env = {
      RESTAURANT_ID: 'default',
      RESTAURANT_NAME: 'Default Restaurant',
      SUPABASE_URL: 'https://rdjfqdpoesjvbluffwzm.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI'
    };
  };
  document.head.appendChild(envScript);
})();
