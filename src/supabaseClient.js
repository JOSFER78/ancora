import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysnorelkaccaikvuqgnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbm9yZWxrYWNjYWlrdnVxZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTg3NTYsImV4cCI6MjA5NDc3NDc1Nn0.iLZj0sbmyr6wMJEIeWG2B0kmo4yeVJJFaL9nEgJZmrs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
