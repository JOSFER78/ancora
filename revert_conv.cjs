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
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error('Auth error: ' + authError.message);

    console.log('Reverting conversation to active...');
    const { data, error } = await supabase
      .from('conversations')
      .update({
        status: 'active',
        closed_at: null
      })
      .eq('id', conversationId)
      .select('id, title, status, closed_at');

    if (error) throw error;
    console.log('SUCCESS:', data);
  } catch (err) {
    console.error('Revert error:', err.message);
  }
}

run();
