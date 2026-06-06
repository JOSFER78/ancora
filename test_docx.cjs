const {
  createSupabaseTestClient,
  getTestCredentials
} = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();

async function test() {
  try {
    const { email, password } = getTestCredentials();

    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error('Auth error: ' + authError.message);

    console.log('Logged in. Token length:', authData.session.access_token.length);

    const { data: sources, error } = await supabase
      .from('mente_sources')
      .select('id, name, content_type, processed, text_content');

    if (error) throw error;

    console.log(`Found ${sources.length} sources.`);
    for (const src of sources) {
      console.log(`\n--- Source: ${src.name} ---`);
      console.log(`ID: ${src.id}`);
      console.log(`Content Type: ${src.content_type}`);
      console.log(`Processed: ${src.processed}`);
      console.log(`Text Length: ${src.text_content ? src.text_content.length : 0}`);
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
