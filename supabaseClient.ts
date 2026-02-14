import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyyvgutoooaqofbzenrv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eXZndXRvb29hcW9mYnplbnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjM1NzYsImV4cCI6MjA4NjU5OTU3Nn0.xZfDhhv2pRujLDCzqZOCFXvn5Aag2tuhWXuCdmNqMaw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
