const {
  createSupabaseTestClient,
  getTestCredentials
} = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();

async function run() {
  const { email, password } = getTestCredentials();

  try {
    console.log(`Logging in as: ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error('Login error: ' + authError.message);

    console.log('Logged in. Token length:', authData.session.access_token.length);

    console.log("Invoking Edge Function 'chat-terapeuta'...");
    const { data: funcData, error: funcError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        messages: [{ role: 'user', content: 'Mensaje de prueba sin datos sensibles.' }]
      }
    });

    if (funcError) {
      console.error('\n--- Edge Function Error (from SDK) ---');
      console.error(funcError);
    } else {
      console.log('\n--- Edge Function Response ---');
      console.log(funcData);
    }
  } catch (err) {
    console.error('Execution error:', err.message);
  }
}

run();
