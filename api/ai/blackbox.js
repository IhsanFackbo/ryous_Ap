// api/ai/blackbox.js
const axios = require('axios');

let handler = async (res, req) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.reply(
        JSON.stringify({
          success: false,
          error: 'Parameter `text` wajib diisi, contoh: ?text=apa itu javascript'
        }),
        { code: 400 }
      );
    }

    const { data } = await axios.get(
      `https://itzpire.com/ai/blackbox-ai?q=${encodeURIComponent(text)}`
    );

    if (!data || !data.result) {
      return res.reply(
        JSON.stringify({
          success: false,
          error: 'Tidak ada hasil ditemukan dari Blackbox AI.'
        }),
        { code: 404 }
      );
    }

    // kirim hasil sebagai JSON string agar tidak muncul [object Object]
    return res.reply(
      JSON.stringify({
        success: true,
        query: text,
        result: data.result
      })
    );
  } catch (error) {
    return res.reply(
      JSON.stringify({
        success: false,
        error: error?.message || String(error)
      }),
      { code: 500 }
    );
  }
};

handler.alias = 'Blackbox AI';
handler.category = 'AI';
handler.params = {
  text: {
    desc: 'Pertanyaan atau perintah yang ingin dijawab oleh AI.',
    example: 'Apa itu Node.js dan bagaimana cara kerjanya?'
  }
};

module.exports = handler;