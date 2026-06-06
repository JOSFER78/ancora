const { createPgClient, createSupabaseTestClient, requireEnv } = require('./local_supabase_env.cjs');

const supabase = createSupabaseTestClient();
const pgClient = createPgClient();

async function run() {
  try {
    await pgClient.connect();
    console.log("Connected to PostgreSQL.");

    const newUserEmail = requireEnv('NEW_USER_EMAIL');
    const newUserPassword = requireEnv('NEW_USER_PASSWORD');

    console.log(`Deleting old user ${newUserEmail}...`);
    await pgClient.query("DELETE FROM auth.users WHERE email = $1;", [newUserEmail]);
    console.log("Deleted old user.");

    // Use Supabase Client to sign up
    console.log("Signing up user via Supabase SDK...");
    const { data, error } = await supabase.auth.signUp({
      email: newUserEmail,
      password: newUserPassword,
      options: {
        data: { role: 'emilio' }
      }
    });

    if (error) {
      throw error;
    }

    console.log("User signed up. User ID:", data.user.id);

    // Confirm email in Postgres
    console.log("Confirming email in database...");
    await pgClient.query(`
      UPDATE auth.users 
      SET email_confirmed_at = now()
      WHERE id = $1;
    `, [data.user.id]);
    console.log("Email confirmed.");

    if (process.env.COPY_BINGX_CREDENTIALS === 'true') {
      const sourceProfileId = requireEnv('SOURCE_PROFILE_ID');
      console.log("Copying BingX credentials...");
      const origProfile = await pgClient.query(
        "SELECT bingx_api_key, bingx_api_secret FROM public.profiles WHERE id = $1;",
        [sourceProfileId]
      );
      if (origProfile.rows.length === 0 || !origProfile.rows[0].bingx_api_key) {
        throw new Error('No se encontraron credenciales BingX en SOURCE_PROFILE_ID.');
      }
      await pgClient.query(`
        UPDATE public.profiles 
        SET bingx_api_key = $1, bingx_api_secret = $2 
        WHERE id = $3;
      `, [origProfile.rows[0].bingx_api_key, origProfile.rows[0].bingx_api_secret, data.user.id]);
      console.log("Credentials copied.");
    }

    console.log("All done!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pgClient.end();
  }
}

run();
