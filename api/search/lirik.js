// api/lyrics.js
const src = scrape('search/lirik');

let handler = async (res, req) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.reply(
        {
          success: false,
          error: 'Parameter "q" (judul lagu) wajib diisi',
        },
        { code: 400 }
      );
    }

    const result = await src(q); // panggil ai/lyrics.js

    return res.reply(
      {
        success: true,
        query: q,
        title: result.title || null,
        thumbnail: result.thumbnail || null,
        url: result.url || null,
        lyrics: result.lyrics || null,
      },
      { code: 200 }
    );
  } catch (error) {
    console.error("Lyrics API Error:", error);

    return res.reply(
      {
        success: false,
        error: error?.message || String(error),
      },
      { code: 500 }
    );
  }
};

handler.alias = "Lyrics Search";
handler.category = "Search";
handler.params = {
  q: {
    desc: "Judul lagu / query untuk dicari liriknya",
    example: "Dark Side Alan Walker",
  },
};

module.exports = handler;