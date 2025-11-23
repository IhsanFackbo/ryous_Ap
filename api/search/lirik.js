// api/lyrics.js
const src = scrape('search/lirik');

let handler = async (res, req) => {
  try {
    const { q } = req.query || {};
    if (!q) {
      return res.reply(
        { status: false, msg: 'Param "q" (judul lagu) wajib diisi' },
        { code: 400 }
      );
    }

    const data = await src(q); // { status, msg, result, source }

    // Selalu 200, biar client cek sendiri status true/false
    return res.reply(data, { code: 200 });
  } catch (e) {
    return res.reply(
      { status: false, msg: e?.message || String(e) },
      { code: 500 }
    );
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Music';
handler.params = {
  q: { desc: 'Judul lagu', example: 'Dark Side Alan Walker' },
};

module.exports = handler;