// lib/scrape_file/image/remini.js
const axios = require('axios');
const FormData = require('form-data');

/**
 * Kirim gambar ke Vyro Inference Engine.
 * @param {Buffer|Uint8Array} imageBuf - buffer gambar (jpeg/png/webp, disarankan jpeg)
 * @param {'enhance'|'recolor'|'dehaze'} mode - default 'enhance'
 * @returns {Promise<Buffer>} - hasil gambar (Buffer)
 */
async function remini(imageBuf, mode = 'enhance') {
  const MODES = new Set(['enhance', 'recolor', 'dehaze']);
  const picked = MODES.has(String(mode)) ? String(mode) : 'enhance';

  if (!imageBuf || !(imageBuf instanceof Buffer || imageBuf?.buffer)) {
    throw new Error('imageBuf wajib berupa Buffer.');
  }

  const url = `https://inferenceengine.vyro.ai/${picked}`;
  const form = new FormData();
  // filename bebas; mimetype aman pakai image/jpeg
  form.append('image', Buffer.from(imageBuf), {
    filename: 'input.jpg',
    contentType: 'image/jpeg',
  });

  try {
    const { data } = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'okhttp/4.9.3',
        Connection: 'Keep-Alive',
        'Accept-Encoding': 'gzip',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 2,
      validateStatus: s => s >= 200 && s < 400,
    });

    const buf = Buffer.from(data);
    if (!buf.length) throw new Error('Balasan kosong dari server.');
    return buf;
  } catch (err) {
    // rapikan pesan error
    const msg = err?.response
      ? `HTTP ${err.response.status} ${err.response.statusText || ''}`.trim()
      : err?.message || String(err);
    throw new Error(`Vyro ${picked} gagal: ${msg}`);
  }
}

module.exports = remini;