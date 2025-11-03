const scrape = require('../../lib/scrape_file/search/lirik');

let handler = async (res, req) => {
  try {
    const q = (req?.query?.text || '').trim();
    if (!q) {
      return res.reply({ success: false, error: 'Parameter "text" wajib diisi.' }, { code: 200 });
    }

    const data = await scrape(q);

    // === KUNCI: bubble up status apa adanya ===
    if (!data?.success) {
      return res.reply({
        success: false,
        query: q,
        provider: data?.provider || null,
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
    }, { code: 200 });
  } catch (err) {
    return res.reply({ success: false, error: String(err?.message || err) }, { code: 200 });
  }
};

handler.alias = 'Lyrics Finder';
handler.category = 'Search';
handler.status = 'error';
handler.params = {
  text: { desc: 'Judul/artist atau potongan lirik', example: 'I wanna be yours' }
};

module.exports = handler;