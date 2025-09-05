// src/services/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mjpjcowtscfhuzfdzyex.supabase.co"; // Replace with your actual URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcGpjb3d0c2NmaHV6ZmR6eWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzY2NzMsImV4cCI6MjA3MjQ1MjY3M30.vL_imRsWBg5lOySvnx7zI1nULgDqn8AnDYsoWCcBWwQ"; // Replace with your anon/public key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
