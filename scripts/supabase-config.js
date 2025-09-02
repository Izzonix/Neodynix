// Use CDN import for browser compatibility!
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://spnxywyrjbwbwntblcjl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbnh5d3lyamJ3YndudGJsY2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDc2NDYsImV4cCI6MjA3MjIyMzY0Nn0.Kjta7PEMwTc[...]';
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase, supabaseUrl };
