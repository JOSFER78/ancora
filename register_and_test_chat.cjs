const crypto = require('crypto');
const { createSupabaseTestClient } = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();

async function run() {
  const email = process.env.NEW_TEST_USER_EMAIL || `test-emilio-${Date.now()}@ayuda.com`;
  const password = process.env.NEW_TEST_USER_PASSWORD || `Test-${crypto.randomBytes(12).toString('hex')}!1`;

  try {
    console.log(`Registering temporary user: ${email}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      throw new Error('SignUp error: ' + signUpError.message);
    }

    if (!signUpData.session) {
      console.log('Registration successful, but the user may require email confirmation.');
      return;
    }

    console.log('Signed up and logged in. Token length:', signUpData.session.access_token.length);

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
