const https = require('https');

const token = '8021173910:AAFsH5fo2IWVoLj4r-fjUSjbamuw3zPWr4k';
const chatId = '@elreydelmambot';
const text = '🤖 <b>Conexión Exitosa</b>\n\nEl sistema de agentes de Antigravity ha verificado la configuración de tu bot de Telegram con éxito.\n\n🔗 Web App: https://ayuda-emilio-83261.web.app';

const payload = JSON.stringify({
  chat_id: chatId,
  text: text,
  parse_mode: 'HTML'
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${token}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Respuesta de sendMessage:');
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(payload);
req.end();
