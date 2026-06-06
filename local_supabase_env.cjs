const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function loadDotenv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotenv();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  }
  return value;
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ysnorelkaccaikvuqgnv.supabase.co';
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || requireEnv('SUPABASE_ANON_KEY');
}

function createSupabaseTestClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

function getTestCredentials() {
  return {
    email: requireEnv('TEST_USER_EMAIL'),
    password: requireEnv('TEST_USER_PASSWORD')
  };
}

function createPgClient() {
  return new Client({
    host: process.env.SUPABASE_DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com',
    port: Number(process.env.SUPABASE_DB_PORT || 6543),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres.ysnorelkaccaikvuqgnv',
    password: requireEnv('SUPABASE_DB_PASSWORD'),
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = {
  createPgClient,
  createSupabaseTestClient,
  getTestCredentials,
  requireEnv
};
