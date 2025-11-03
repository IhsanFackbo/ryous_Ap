// api/search/lirik.js
const scrape = require('../../lib/scrape_file/search/lirik');

const handler = async (res, req) => {
  try {
    const { text } = req.query; // konsisten pakai ?text=
    if (!text || !String(text).trim()) {
      return res.reply({ success: false, error: 'Parameter "text" wajib.' }, { code: 400 });
    }

    const data = await scrape(text);

    // Kalau scraper gagal, balikin status 404/400 sesuai message
    if (!data || data.success === false) {
      return res.reply({ success: false, error: data?.message || 'Lirik tidak ditemukan.' }, { code: 404 });
    }

    // Sukses -> kirim JSON asli (jangan di-concat ke string!)
    return res.reply({
      success: true,
      provider: 'musixmatch',
      query: text,
      result: {
        title: data.title,
        artist: data.artist,
        thumbnail: data.thumbnail,
        link: data.link,
        lyrics: data.lyrics
      }
    });
  } catch (err) {
    return res.reply(
      { success: false, error: String(err?.message || err) },
      { code: 500 }
    );
  }
};

handler.alias = 'Lyrics Search';
handler.category = 'Search';        // <— samakan case, jangan 'search'
handler.params = {
  text: { desc: 'Judul lagu/artist untuk dicari liriknya', example: 'hati hati di jalan tulus' }
};

module.exports = handler;