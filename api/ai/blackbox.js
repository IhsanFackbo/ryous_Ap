// api/ai/blackbox.js
const axios = require('axios');

async function callBlackbox(url, text) {
  const res = await axios.get(`${url}?q=${encodeURIComponent(text)}`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Node; Blackbox-Relay)'
    },
    timeout: 20000,
    // biar kita bisa tangani 4xx/5xx sendiri
    validateStatus: () => true
  });

  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    data: res.data
  };
}

let handler = async (res, req) => {
  try {
    const { text } = req.query || {};
    const q = (text || '').trim();
    if (!q) {
      return res.reply(
        { success: false, error: 'Parameter `text` wajib diisi, contoh: ?text=apa itu javascript' },
        { code: 400 }
      );
    }

    // daftar fallback yang akan dicoba berurutan
    const CANDIDATES = [
      'https://itzpire.com/ai/blackbox-ai', // versi yang kamu pakai
      'https://itzpire.com/ai/blackbox',    // fallback kemungkinan
      'https://itzpire.com/ai/blackboxai'   // fallback kemungkinan lain
    ];

    let lastErr = null;
    for (const base of CANDIDATES) {
      try {
        const r = await callBlackbox(base, q);

        // sukses
        if (r.ok && r.data && (r.data.result || r.data.answer || typeof r.data === 'string')) {
          const result =
            typeof r.data === 'string'
              ? r.data
              : (r.data.result || r.data.answer || '');

          return res.reply({
            success: true,
            provider: base,
            query: q,
            result
          });
        }

        // gagal: simpan error untuk dilaporkan nanti
        lastErr = {
          providerTried: base,
          status: r.status,
          body: r.data
        };

        // kalau 404, lanjut ke kandidat berikutnya
        // kalau 401/403/429/5xx, juga lanjut—biar ada kesempatan kandidat lain
        continue;
      } catch (e) {
        // network/timeout/axios error
        lastErr = {
          providerTried: base,
          status: e.response?.status || 0,
          body: e.response?.data || e.message
        };
        continue;
      }
    }

    // semua kandidat gagal
    return res.reply(
      {
        success: false,
        error: 'Semua provider Blackbox gagal atau tidak ditemukan.',
        detail: lastErr // kasih konteks agar gampang debug di client/log
      },
      { code: (lastErr && lastErr.status) || 502 }
    );
  } catch (error) {
    // guard terakhir
    return res.reply(
      { success: false, error: error?.message || String(error) },
      { code: 500 }
    );
  }
};

handler.alias = 'Blackbox AI';
handler.category = 'AI';
handler.params = {
  text: {
    desc: 'Pertanyaan/perintah untuk dijawab AI.',
    example: 'Apa itu Node.js dan bagaimana cara kerjanya?'
  }
};

module.exports = handler;