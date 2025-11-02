// api/ai/blackbox.js
// Drop-in Blackbox API (API key di dalam file)

// === KONFIGURASI CEPAT ===
const API_KEY  = 'SK_BLACKBOX_TARUH_DISINI';   // <-- GANTI dengan key milikmu
const MODEL    = 'gpt-4o';                      // model default (bisa: gpt-4o, gpt-4o-mini, dll)
const ENDPOINT = 'https://api.blackbox.ai/engines/gpt-4o/chat/completions';

const axios = require('axios');

async function callBlackbox(text) {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: text }],
  };

  const resp = await axios.post(ENDPOINT, body, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 20000,
    validateStatus: () => true, // kita handle error sendiri
  });

  return resp;
}

let handler = async (res, req) => {
  try {
    const q = (req.query?.text || '').trim();
    if (!q) {
      return res.reply(
        { success: false, error: 'Parameter `text` wajib diisi, contoh: ?text=Apa itu Node.js?' },
        { code: 400 }
      );
    }

    if (!API_KEY || API_KEY === 'shura-blc') {
      return res.reply(
        { success: false, error: 'API key belum diisi. Edit file api/ai/blackbox.js pada konstanta API_KEY.' },
        { code: 401 }
      );
    }

    const r = await callBlackbox(q);

    // sukses
    if (r.status >= 200 && r.status < 300) {
      const msg = r.data?.choices?.[0]?.message?.content
               || r.data?.message
               || r.data?.result
               || '';
      if (!msg) {
        return res.reply(
          { success: false, error: 'Respon kosong dari Blackbox.' },
          { code: 502 }
        );
      }
      return res.reply({
        success: true,
        provider: 'blackbox.ai',
        model: MODEL,
        query: q,
        result: msg,
      });
    }

    // mapping error ramah
    const status = r.status;
    const body   = r.data;

    if (status === 401) {
      return res.reply(
        { success: false, error: '401 Unauthorized — API key salah/invalid atau tidak dikirim.' },
        { code: 401 }
      );
    }
    if (status === 429) {
      return res.reply(
        { success: false, error: '429 Rate limit — coba lagi beberapa saat.' },
        { code: 429 }
      );
    }
    if (status >= 500) {
      return res.reply(
        { success: false, error: `Server provider error (${status}).`, detail: body },
        { code: status }
      );
    }

    // error lain
    return res.reply(
      { success: false, error: `Request gagal (${status}).`, detail: body },
      { code: status || 500 }
    );

  } catch (e) {
    // network/timeout/axios error
    const status = e?.response?.status || 500;
    const detail = e?.response?.data || e.message || String(e);
    return res.reply(
      { success: false, error: 'Gagal memanggil Blackbox.', detail },
      { code: status }
    );
  }
};

handler.alias = 'Blackbox Chat';
handler.category = 'AI';
handler.params = {
  text: { desc: 'Pertanyaan/permintaan ke AI', example: 'Tuliskan contoh kode Express sederhana' }
};

module.exports = handler;