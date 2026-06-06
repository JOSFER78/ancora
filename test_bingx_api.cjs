const crypto = require('crypto');
const { createPgClient, requireEnv } = require('./local_supabase_env.cjs');

function getBingXSignature(queryString, apiSecret) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

async function run() {
  const pgClient = createPgClient();
  const profileId = requireEnv('BINGX_PROFILE_ID');

  await pgClient.connect();
  const res = await pgClient.query(
    'SELECT bingx_api_key, bingx_api_secret FROM public.profiles WHERE id = $1;',
    [profileId]
  );
  await pgClient.end();

  if (res.rows.length === 0 || !res.rows[0].bingx_api_key || !res.rows[0].bingx_api_secret) {
    throw new Error('No se encontraron credenciales BingX para BINGX_PROFILE_ID.');
  }

  const { bingx_api_key: key, bingx_api_secret: secret } = res.rows[0];

  try {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const limit = 50;
    const params = `limit=${limit}&recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = getBingXSignature(params, secret);
    const url = `https://open-api.bingx.com/openApi/swap/v2/trade/allOrders?${params}&signature=${signature}`;

    const resp = await fetch(url, {
      headers: { "X-BX-APIKEY": key }
    });
    console.log("allOrders status:", resp.status);
    const json = await resp.json();
    console.log("allOrders Response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error allOrders:", err);
  }
}

run();
