const {
  createSupabaseTestClient,
  getTestCredentials
} = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();

async function run() {
  try {
    const { email, password } = getTestCredentials();

    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error('Auth error: ' + authError.message);

    console.log('Logged in. Token length:', authData.session.access_token.length);

    console.log("Invoking Edge Function 'chat-terapeuta' with prepare_mente_sync...");
    const prepStart = Date.now();
    const { data: prepData, error: prepError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        action: 'prepare_mente_sync',
        reset: true
      }
    });

    console.log(`prepare_mente_sync finished in ${((Date.now() - prepStart) / 1000).toFixed(1)}s`);

    if (prepError) {
      console.error('Prepare error:', prepError);
      return;
    }

    const runId = prepData.runId;
    const queue = prepData.queue || [];
    console.log(`Queue length: ${queue.length}`);

    let totalProcessed = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      console.log(`\n--- Processing item ${i + 1}/${queue.length}: ${item.type} (${item.id}) ---`);

      const itemStart = Date.now();
      const { data: itemData, error: itemError } = await supabase.functions.invoke('chat-terapeuta', {
        body: {
          action: 'process_mente_sync_item',
          runId,
          item
        }
      });

      console.log(`Processed in ${((Date.now() - itemStart) / 1000).toFixed(1)}s`);

      if (itemError) {
        console.error('Item error:', itemError);
      } else if (itemData.success) {
        totalProcessed++;
      }
    }

    console.log('\n--- Consolidating Mente sync ---');
    const consStart = Date.now();
    const { data: consData, error: consError } = await supabase.functions.invoke('chat-terapeuta', {
      body: {
        action: 'consolidate_mente_sync',
        runId
      }
    });

    console.log(`consolidate_mente_sync finished in ${((Date.now() - consStart) / 1000).toFixed(1)}s`);
    if (consError) {
      console.error('Consolidation error:', consError);
    } else {
      console.log('Consolidation success:', Boolean(consData?.success));
      console.log('Total processed:', totalProcessed);
    }
  } catch (err) {
    console.error('Execution error:', err.message);
  }
}

run();
