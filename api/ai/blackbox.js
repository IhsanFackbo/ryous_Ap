// api/ai/blackbox.js
// Blackbox API – kirim SELALU string JSON agar tidak [object Object]

const axios = require('axios');

// ======= SET DI SINI =======
const API_KEY  = 'bb_b82cceed68dfa68e59a9470152bdc2eb512787c9f4aed2b85bf85e473bb8464c';  // ← ganti dengan key kamu (sk-...)
const MODEL    = 'gpt-4o';
const ENDPOINT = 'https://api.blackbox.ai/engines/gpt-4o/chat/completions';
// ===========================

async function callBlackbox(text) {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: text }]
  };

  // validateStatus -> true supaya kita handle status manual
  return axios.post(ENDPOINT, body, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 20000,
    validateStatus: () => true
  });
}

let handler = async (res, req) => {
  try {
    const q = (req.query?.text || '').trim();

    if (!q) {
      return res.reply(
        JSON.stringify({
          success: false,
          error: 'Parameter `text` wajib diisi, contoh: ?text=Apa itu Node.js?'
        }),
        { code: 400 }
      );
    }

    if (!API_KEY || API_KEY === 'SK_BLACKBOX_TARUH_DISINI') {
      return res.reply(
        JSON.stringify({
          success: false,
          error: 'API key belum diisi. Edit konstanta API_KEY di api/ai/blackbox.js'
        }),
        { code: 401 }
      );
    }

    const r = await callBlackbox(q);

    if (r.status >= 200 && r.status < 300) {
      const msg =
        r.data?.choices?.[0]?.message?.content ||
        r.data?.message ||
        r.data?.result ||
        '';

      if (!msg) {
        return res.reply(
          JSON.stringify({
            success: false,
            error: 'Respon kosong dari Blackbox.'
          }),
          { code: 502 }
        );
      }

      return res.reply(
        JSON.stringify({
          success: true,
          provider: 'blackbox.ai',
          model: MODEL,
          query: q,
          result: msg
        })
      );
    }

    // Map error umum
    const status = r.status;
    const body = r.data;

    if (status === 401) {
      return res.reply(
        JSON.stringify({
          success: false,
          error: '401 Unauthorized — API key salah/invalid atau tidak dikirim.',
          detail: body
        }),
        { code: 401 }
      );
    }

    if (status === 429) {
      return res.reply(
        JSON.stringify({
          success: false,
          error: '429 Rate limit — coba lagi beberapa saat.',
          detail: body
        }),
        { code: 429 }
      );
    }

    if (status >= 500) {
      return res.reply(
        JSON.stringify({
          success: false,
          error: `Server provider error (${status}).`,
          detail: body
        }),
        { code: status }
      );
    }

    return res.reply(
      JSON.stringify({
        success: false,
        error: `Request gagal (${status}).`,
        detail: body
      }),
      { code: status || 500 }
    );
  } catch (e) {
    const status = e?.response?.status || 500;
    const detail = e?.response?.data || e.message || String(e);
    return res.reply(
      JSON.stringify({
        success: false,
        error: 'Gagal memanggil Blackbox.',
        detail
      }),
      { code: status }
    );
  }
};

handler.alias = 'Blackbox Chat';
handler.category = 'AI';
handler.params = {
  text: { desc: 'Pertanyaan ke AI', example: 'Tuliskan contoh kode Express sederhana' }
};

module.exports = handler;