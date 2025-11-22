// api/lyrics.js
const src = scrape('ai/lyrics');

let handler = async (res, req) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.reply(
        {
          success: false,
          error: 'Parameter q wajib diisi (judul lagu / query).'
        },
        { code: 400 }
      );
    }

    const data = await src(q);

    return res.reply({
      success: true,
      query: q,
      title: data.title,
      thumbnail: data.thumbnail,
      url: data.url,
      lyrics: data.lyrics // bisa null kalau cuma dapet snippet / link
    });
  } catch (error) {
    console.error('Lyrics API Error:', error);

    const msg =
      typeof error === 'string'
        ? error
        : error?.message || JSON.stringify(error);

    return res.reply(
      {
        success: false,
        error: msg
      },
      { code: 500 }
    );
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Search';
handler.params = {
  q: {
    desc: 'Judul lagu / query untuk dicari di Genius',
    example: 'The Weeknd Blinding Lights'
  }
};

module.exports = handler;