const https = require('https');

const token = '8021173910:AAFsH5fo2IWVoLj4r-fjUSjbamuw3zPWr4k';
const url = `https://api.telegram.org/bot${token}/getUpdates`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Resultados de getUpdates:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('Error al parsear JSON:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('Error de red:', e.message);
});
