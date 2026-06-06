const { createPgClient } = require('./local_supabase_env.cjs');

const pgClient = createPgClient();

async function check() {
  try {
    await pgClient.connect();
    console.log("Conectado a Postgres.");
    const res = await pgClient.query(`
      SELECT
        p.id,
        u.email,
        p.bingx_api_key IS NOT NULL AS has_bingx_api_key,
        p.bingx_api_secret IS NOT NULL AS has_bingx_api_secret,
        p.app_config IS NOT NULL AND p.app_config <> '{}'::jsonb AS has_app_config
      FROM public.profiles p
      LEFT JOIN auth.users u ON p.id = u.id;
    `);
    console.log(`Encontrados ${res.rows.length} perfiles:`);
    res.rows.forEach(r => {
      console.log(`ID: ${r.id}`);
      console.log(`  Email: ${r.email}`);
      console.log(`  Tiene BingX Key: ${r.has_bingx_api_key ? 'SI' : 'NO'}`);
      console.log(`  Tiene BingX Secret: ${r.has_bingx_api_secret ? 'SI' : 'NO'}`);
      console.log(`  Tiene App Config: ${r.has_app_config ? 'SI' : 'NO'}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pgClient.end();
  }
}

check();
