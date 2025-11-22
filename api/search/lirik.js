// api/lyrics.js
const src = scrape('ai/lyrics');

let handler = async (res, req) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.reply(
        {
          success: false,
          error: 'Parameter q wajib diisi (judul lagu).'
        },
        { code: 400 }
      );
    }

    const data = await src(q);

    return res.reply(
      {
        success: data.success !== false,
        query: q,
        title: data.title || null,
        thumbnail: data.thumbnail || null,
        url: data.url || null,
        lyrics: data.lyrics || null,
        error: data.error || null
      },
      { code: 200 }
    );
  } catch (e) {
    console.error('Lyrics API Error:', e);

    return res.reply(
      {
        success: false,
        error: e?.message || String(e)
      },
      { code: 500 }
    );
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Music';
handler.params = {
  q: {
    desc: 'Judul lagu yang ingin dicari',
    example: 'Olivia Rodrigo – Drivers License'
  }
};

module.exports = handler;