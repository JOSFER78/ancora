// create_test_users.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysnorelkaccaikvuqgnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbm9yZWxrYWNjYWlrdnVxZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTg3NTYsImV4cCI6MjA5NDc3NDc1Nn0.iLZj0sbmyr6wMJEIeWG2B0kmo4yeVJJFaL9nEgJZmrs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const usersToCreate = [
  { email: 'tisute@gmail.com', password: '111111', role: 'paciente' },
  { email: 'davidsevilla10@gmail.com', password: '111111', role: 'paciente' },
  { email: 'tisutet@hormail.com', password: '111111', role: 'psicologo' },
  { email: 'usajosefernan@gmail.com', password: '111111', role: 'psicologo' }
];

async function run() {
  for (const u of usersToCreate) {
    console.log(`Registrando en Auth: ${u.email}...`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: {
          data: { role: u.role }
        }
      });
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          console.log(`[OK] El usuario ${u.email} ya existe.`);
        } else {
          throw error;
        }
      } else {
        console.log(`[OK] Registrado. ID: ${data.user?.id}`);
      }
    } catch (e) {
      console.error(`Error al registrar ${u.email}:`, e.message);
    }
  }
  console.log("Registro inicial finalizado.");
}

run();
