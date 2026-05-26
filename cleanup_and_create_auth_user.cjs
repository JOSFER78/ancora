const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = 'https://ysnorelkaccaikvuqgnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbm9yZWxrYWNjYWlrdnVxZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTg3NTYsImV4cCI6MjA5NDc3NDc1Nn0.iLZj0sbmyr6wMJEIeWG2B0kmo4yeVJJFaL9nEgJZmrs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pgClient = new Client({
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ysnorelkaccaikvuqgnv',
  password: 'EmilioSurvival2026!',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await pgClient.connect();
    console.log("Connected to PostgreSQL.");

    // Delete manually created user
    console.log("Deleting old emilio@ayuda.com...");
    await pgClient.query("DELETE FROM auth.users WHERE email = 'emilio@ayuda.com';");
    console.log("Deleted old user.");

    // Use Supabase Client to sign up
    console.log("Signing up user via Supabase SDK...");
    const { data, error } = await supabase.auth.signUp({
      email: 'emilio@ayuda.com',
      password: 'emilio123',
      options: {
        data: { role: 'emilio' }
      }
    });

    if (error) {
      throw error;
    }

    console.log("User signed up. User ID:", data.user.id);

    // Confirm email in Postgres
    console.log("Confirming email in database...");
    await pgClient.query(`
      UPDATE auth.users 
      SET email_confirmed_at = now()
      WHERE id = $1;
    `, [data.user.id]);
    console.log("Email confirmed.");

    // Copy BingX credentials from josferestudio@gmail.com
    const origProfile = await pgClient.query("SELECT bingx_api_key, bingx_api_secret FROM public.profiles WHERE id = 'aeb78e97-5a44-4c24-9390-c32508dda09d';");
    if (origProfile.rows.length > 0 && origProfile.rows[0].bingx_api_key) {
      console.log("Copying BingX credentials...");
      await pgClient.query(`
        UPDATE public.profiles 
        SET bingx_api_key = $1, bingx_api_secret = $2 
        WHERE id = $3;
      `, [origProfile.rows[0].bingx_api_key, origProfile.rows[0].bingx_api_secret, data.user.id]);
      console.log("Credentials copied.");
    }

    console.log("All done!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pgClient.end();
  }
}

run();
