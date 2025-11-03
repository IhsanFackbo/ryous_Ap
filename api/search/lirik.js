// api/search/lirik.js
const scrape = require('../../lib/scrape_file/search/lirik');

const handler = async (res, req) => {
  try {
    const q = (req?.query?.text || '').trim();

    if (!q) {
      return res.reply({ success: false, error: 'Parameter "text" wajib.' }, { code: 200 });
    }

    const data = await scrape(q);

    if (!data || data.success === false) {
      return res.reply({
        success: false,
        query: q,
        error: data?.message || 'Lirik tidak ditemukan.'
      }, { code: 200 }); // <— 200 supaya UI kamu tidak men-set "Error: [object Object]"
    }

    return res.reply({
      success: true,
      provider: 'musixmatch',
      query: q,
      result: {
        title: data.title,
        artist: data.artist,
        thumbnail: data.thumbnail,
        link: data.link,
        lyrics: data.lyrics
      }
    });
  } catch (err) {
    return res.reply({
      success: false,
      error: String(err?.message || err)
    }, { code: 200 }); // tetap 200
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Search';
handler.params = {
  text: { desc: 'Judul lagu / artist', example: 'I wanna be yours' }
};

module.exports = handler;