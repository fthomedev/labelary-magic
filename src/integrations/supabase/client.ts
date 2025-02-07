
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ekoakbihwprthzjyztwq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrb2FrYmlod3BydGh6anl6dHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NzE3ODcsImV4cCI6MjA1NDU0Nzc4N30.uwwOYRJ2pGghHSnTPifqfuGobx9QmnkoSpmaU9fkpu8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
