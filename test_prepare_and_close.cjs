const {
  createSupabaseTestClient,
  getTestCredentials,
  requireEnv
} = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();

async function run() {
  try {
    const { email, password } = getTestCredentials();
    const conversationId = requireEnv('CONVERSATION_ID');

    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error('Auth error: ' + authError.message);

    console.log('Logged in. Token length:', authData.session.access_token.length);

    console.log("Invoking Edge Function 'chat-terapeuta' with prepare_close_conversation...");
    const { data: prepareData, error: prepareError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        action: 'prepare_close_conversation',
        conversationId
      }
    });

    if (prepareError) {
      console.error('\n--- prepare_close_conversation Error ---');
      console.error(prepareError);
      return;
    }

    console.log('Prepare success:', Boolean(prepareData?.success));

    console.log("Invoking Edge Function 'chat-terapeuta' with close_conversation...");
    const { data: closeData, error: closeError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        action: 'close_conversation',
        conversationId
      }
    });

    if (closeError) {
      console.error('\n--- close_conversation Error ---');
      console.error(closeError);
    } else {
      console.log('Close success:', Boolean(closeData?.success));
    }
  } catch (err) {
    console.error('Execution error:', err.message);
  }
}

run();
