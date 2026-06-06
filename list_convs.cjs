const { createSupabaseTestClient, getTestCredentials } = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();

async function run() {
  try {
    const { email, password } = getTestCredentials();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, status, closed_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    console.log(`Conversations found: ${data.length}`);
    data.forEach((c) => {
      console.log(`ID: ${c.id}, Title: ${c.title}, Status: ${c.status}, ClosedAt: ${c.closed_at}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
