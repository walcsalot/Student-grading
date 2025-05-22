import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vluznqpitjsywnjbomgz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdXpucXBpdGpzeXduamJvbWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzQxMjAsImV4cCI6MjA2MzMxMDEyMH0.xuubrsnfo68TB1ZZHuGQbZul4_PvST9Epof47D5xuE4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
