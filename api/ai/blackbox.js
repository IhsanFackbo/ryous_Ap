// api/ai/blackbox.js
const axios = require('axios');

// === GANTI INI DGN KEY MU ===
const API_KEY = 'sk-blackbox-isanap';
// ============================

const ENDPOINT = 'https://api.blackbox.ai/chat/completions';
const MODEL    = 'openai/gpt-4o';

async function callBB(prompt) {
  return axios.post(
    ENDPOINT,
    { model: MODEL, messages: [{ role: 'user', content: prompt }], stream: false },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000,
      validateStatus: () => true
    }
  );
}

let handler = async (res, req) => {
  try {
    const q = (req.query?.text || '').trim();
    if (!q) return res.reply(JSON.stringify({ success:false, error:'Param `text` wajib' }), { code:400 });
    if (!API_KEY || !API_KEY.startsWith('sk_'))
      return res.reply(JSON.stringify({ success:false, error:'API key belum/invalid. Isi konstanta API_KEY (format sk_)' }), { code:401 });

    const r = await callBB(q);

    if (r.status >= 200 && r.status < 300) {
      const msg = r.data?.choices?.[0]?.message?.content || '';
      if (!msg) return res.reply(JSON.stringify({ success:false, error:'Respon kosong dari Blackbox' }), { code:502 });
      return res.reply(JSON.stringify({ success:true, provider:'blackbox.ai', model:MODEL, result: msg }));
    }

    // Error mapping rapi
    const detail = r.data || null;
    if (r.status === 401) return res.reply(JSON.stringify({ success:false, error:'Unauthorized (cek sk_ key kamu)', detail }), { code:401 });
    if (r.status === 402) return res.reply(JSON.stringify({ success:false, error:'Insufficient credits / plan', detail }), { code:402 });
    if (r.status === 429) return res.reply(JSON.stringify({ success:false, error:'Rate limited, coba lagi', detail }), { code:429 });

    return res.reply(JSON.stringify({ success:false, error:`Error ${r.status}`, detail }), { code:r.status || 500 });
  } catch (e) {
    const status = e?.response?.status || 500;
    const detail = e?.response?.data || e.message || String(e);
    return res.reply(JSON.stringify({ success:false, error:'Gagal call Blackbox', detail }), { code:status });
  }
};

handler.alias = 'Blackbox Chat';
handler.category = 'AI';
handler.params = { text: { desc: 'Prompt', example: 'Hai, siapa kamu?' } };
module.exports = handler;