// ai/fastflux.js
const axios = require('axios');

async function generateImage(text) {
  if (!text) throw new Error('text is required.');

  const url = 'https://fast-flux-demo.replicate.workers.dev/api/generate-image';

  const { data } = await axios.get(url, {
    params: { text },
    responseType: 'arraybuffer', // ⬅️ PENTING, karena ini image, bukan JSON
    headers: {
      'user-agent':
        'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.7499.34 Mobile Safari/537.36',
      accept: '*/*'
    }
  });

  const buffer = Buffer.from(data);
  const base64 = buffer.toString('base64');
  const mimeType = 'image/webp'; // dari header sebenernya bisa dicek, tapi kita tahu ini WEBP

  return {
    prompt: text,
    mimeType,
    base64,
    dataUrl: `data:${mimeType};base64,${base64}`
  };
}

module.exports = {
  generateImage
};