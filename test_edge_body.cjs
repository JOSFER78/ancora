const https = require('https');
const {
  createSupabaseTestClient,
  getTestCredentials
} = require('./local_supabase_env.cjs');

const url = 'https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta';
const supabase = createSupabaseTestClient();

async function run() {
  const { email, password } = getTestCredentials();

  console.log('Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const userToken = data.session.access_token;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    }
  };

  const req = https.request(url, options, (res) => {
    console.log('STATUS:', res.statusCode);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('BODY:', body);
    });
  });

  req.on('error', (err) => {
    console.error('HTTP REQUEST ERROR:', err.message);
  });

  req.write(JSON.stringify({
    messages: [{ role: 'user', content: 'Mensaje de prueba sin datos sensibles.' }]
  }));
  req.end();
}

run().catch((err) => {
  console.error('Execution error:', err.message);
});
