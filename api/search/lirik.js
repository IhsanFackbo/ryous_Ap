// api/search/lirik.js
const scrape = require('../../lib/scrape_file/search/lirik');

const handler = async (res, req) => {
  try {
    const q = (req?.query?.text || '').trim();
    if (!q) return res.reply({ success: false, error: 'Parameter "text" wajib.' }, { code: 200 });

    const data = await scrape(q);

    if (!data?.success) {
      return res.reply({
        success: false,
        query: q,
        error: data?.message || 'Gagal mengambil lirik.'
      }, { code: 200 });
    }

    return res.reply({
      success: true,
      provider: data.provider,
      query: data.query,
      result: {
        title: data.title,
        artist: data.artist,
        link: data.link,
        thumbnail: data.thumbnail,
        lyrics: data.lyrics
      }
    });
  } catch (err) {
    return res.reply({ success: false, error: String(err?.message || err) }, { code: 200 });
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Search';
handler.params = { text: { desc: 'Judul/artist lagu', example: 'I wanna be yours' } };

module.exports = handler;