const https = require('https');

const url = 'https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbm9yZWxrYWNjYWlrdnVxZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTg3NTYsImV4cCI6MjA5NDc3NDc1Nn0.iLZj0sbmyr6wMJEIeWG2B0kmo4yeVJJFaL9nEgJZmrs'; // Let's use service token or anon key

async function run() {
  // Let's sign in first to get an active user token
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient('https://ysnorelkaccaikvuqgnv.supabase.co', token);
  
  console.log("Logging in...");
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test-emilio-1779729481582@ayuda.com',
    password: 'emilio123'
  });
  
  const userToken = data.session.access_token;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  };

  const req = https.request(url, options, (res) => {
    console.log('STATUS:', res.statusCode);
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('BODY:', body);
    });
  });

  req.on('error', (err) => {
    console.error('HTTP REQUEST ERROR:', err.message);
  });

  req.write(JSON.stringify({
    messages: [{ role: 'user', content: 'Hola' }]
  }));
  req.end();
}

run();
