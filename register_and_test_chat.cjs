const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysnorelkaccaikvuqgnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbm9yZWxrYWNjYWlrdnVxZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTg3NTYsImV4cCI6MjA5NDc3NDc1Nn0.iLZj0sbmyr6wMJEIeWG2B0kmo4yeVJJFaL9nEgJZmrs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `test-emilio-${Date.now()}@ayuda.com`;
  const password = 'emilio123';
  
  try {
    console.log(`Registering temporary user: ${email}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      throw new Error("SignUp error: " + signUpError.message);
    }

    const session = signUpData.session;
    if (!session) {
      console.log("Registration successful, but needs email confirmation. Logging in anyway...");
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (loginError) throw loginError;
      console.log("Logged in successfully after signUp!");
    } else {
      console.log("Signed up & Logged in successfully! Token length:", session.access_token.length);
    }

    const token = session?.access_token || signUpData.session?.access_token;
    
    console.log("Invoking Edge Function 'chat-terapeuta'...");
    const { data: funcData, error: funcError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        messages: [{ role: 'user', content: 'Hola Walter' }]
      }
    });

    if (funcError) {
      console.error("\n--- Edge Function Error (from SDK) ---");
      console.error(funcError);
    } else {
      console.log("\n--- Edge Function Response ---");
      console.log(funcData);
    }

  } catch (err) {
    console.error("Execution error:", err.message);
  }
}

run();
