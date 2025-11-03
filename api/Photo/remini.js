// api/image/remini.js
const axios = require('axios');
const remini = require('../../lib/scrape_file/Photo/Remini');

async function readBodyAsBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

let handler = async (res, req) => {
  try {
    const q = req.query || {};
    const mode = String(q.mode || 'enhance').toLowerCase();

    let inputBuf = null;

    if (q.url) {
      const { data } = await axios.get(q.url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      inputBuf = Buffer.from(data);
    } else if (/^image\//i.test(String(req.headers['content-type'] || ''))) {
      inputBuf = await readBodyAsBuffer(req);
    }

    if (!inputBuf) {
      return res.reply(
        {
          success: false,
          error: 'Kirim ?url=<gambar> atau POST body biner image dengan Content-Type: image/*',
          usage: {
            GET: '/image/remini?mode=enhance&url=https://host/foto.jpg',
            POST: 'curl -X POST -H "Content-Type: image/jpeg" --data-binary @in.jpg /image/remini?mode=dehaze'
          }
        },
        { code: 400 }
      );
    }

    const out = await remini(inputBuf, mode);

    // kirim langsung sebagai file
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="remini_${mode}.jpg"`);
    return res.end(out);
  } catch (e) {
    return res.reply(
      { success: false, error: e?.message || String(e) },
      { code: 500 }
    );
  }
};

handler.alias = 'Remini (Vyro)';
handler.category = 'Image';
handler.params = {
  mode: { desc: 'enhance|recolor|dehaze', example: 'enhance' },
  url:  { desc: 'URL gambar (opsional jika POST body biner)', example: 'https://...' }
};

module.exports = handler;