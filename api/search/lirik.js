// api/lyrics.js
const src = scrape('ai/lyrics');

let handler = async (res, req) => {
  try {
    const { q } = req.query || {};

    if (!q) {
      // Bad request, tapi tetap kirim msg string (bukan object)
      return res.reply(
        {
          status: false,
          msg: 'Param "q" (judul lagu) wajib diisi',
        },
        { code: 400 }
      );
    }

    const data = await src(q); // { status, result?, msg? }

    // Di sini TIDAK lempar error lagi, cukup balikin apa adanya
    // Biar client bisa cek data.status
    return res.reply(data, { code: 200 });
  } catch (err) {
    console.error("Lyrics API Fatal:", err);

    // DI SINI JUGA JANGAN KIRIM OBJECT RAW KE STRING
    return res.reply(
      {
        status: false,
        msg: err?.message || String(err),
      },
      { code: 500 }
    );
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Music';
handler.params = {
  q: {
    desc: 'Judul lagu / query untuk dicari liriknya',
    example: 'Dark Side Alan Walker',
  },
};

module.exports = handler;