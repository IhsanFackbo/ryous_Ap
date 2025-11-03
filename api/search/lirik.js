// api/music/lirik.js
const src = require('../../lib/scrape_file/search/lirik');
let handler = async (res, req) => {
  try {
    const { query } = req;
    const q = query.text || '';
    if (!q) return res.reply({ success: false, error: 'Masukkan judul lagu!' }, { code: 400 });

    const data = await src(q);
    if (!data.success)
      return res.reply({ success: false, error: data.message }, { code: 404 });

    res.reply({
      success: true,
      result: {
        title: data.title,
        thumbnail: data.thumbnail,
        link: data.link,
        lyrics: data.lyrics,
      },
    });
  } catch (error) {
    res.reply({ success: false, error: error.message }, { code: 500 });
  }
};

handler.alias = 'Musixmatch Lirik';
handler.category = 'Music';
handler.params = {
  text: { desc: 'Judul lagu untuk dicari liriknya', example: 'Perfect - Ed Sheeran' },
};

module.exports = handler;