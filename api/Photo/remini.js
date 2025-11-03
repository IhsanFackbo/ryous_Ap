const axios = require('axios');
const remini = require('../../lib/scrape_file/image/remini');

function sendJson(res, obj, code=200) {
  try { res.statusCode = code; } catch {}
  try { res.setHeader('Content-Type','application/json'); } catch {}
  res.end(JSON.stringify(obj));
}

async function readBodyAsBuffer(req) {
  return new Promise((resolve,reject)=>{
    const chunks=[]; req.on('data',c=>chunks.push(c));
    req.on('end',()=>resolve(Buffer.concat(chunks)));
    req.on('error',reject);
  });
}

let handler = async (res, req) => {
  const q = req.query || {};
  const mode = String(q.mode || 'enhance').toLowerCase();
  const imgUrl = q.url;

  try {
    // Ambil input gambar
    let inputBuf = null;
    if (imgUrl) {
      const { data } = await axios.get(imgUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      inputBuf = Buffer.from(data);
    } else if (/^image\//i.test(String(req.headers['content-type']||''))) {
      inputBuf = await readBodyAsBuffer(req);
    }

    if (!inputBuf) {
      return sendJson(res, {
        success:false,
        error:'Invalid parameters. Kirim ?url=<gambar> atau POST body image/*',
        usage:{
          GET:'/photo/remini?mode=enhance&url=https://host/img.jpg',
          POST:'curl -X POST -H "Content-Type: image/jpeg" --data-binary @in.jpg https://host/photo/remini?mode=dehaze'
        }
      }, 400);
    }

    const out = await remini(inputBuf, mode);

    // Sukses → kirim buffer image
    try { res.setHeader('Content-Type','image/jpeg'); } catch {}
    try { res.setHeader('Content-Disposition', `inline; filename="remini_${mode}.jpg"`); } catch {}
    return res.end(out);

  } catch (e) {
    // Jangan “[object Object]” lagi — selalu JSON jelas
    console.error('REMINI ERROR:', e);
    return sendJson(res, {
      success:false,
      provider:'vyro',
      mode,
      url: imgUrl || '(body)',
      error: e.message || String(e)
    }, 500);
  }
};

handler.alias = 'Remini (Vyro)';
handler.category = 'Photo';
handler.params = {
  mode:{desc:'enhance|recolor|dehaze', example:'enhance'},
  url:{desc:'URL gambar (opsional jika POST body biner)', example:'https://.../image.jpg'}
};

module.exports = handler;