const scrape = require('../../lib/scrape_file/search/lirik');

let handler = async (res, req) => {
  try {
    // ambil parameter text dari query string
    const q = (req?.query?.text || '').trim();
    if (!q)
      return res.reply(
        { success: false, error: 'Parameter "text" wajib diisi.' },
        { code: 400 }
      );

    // panggil fungsi scraper lirik
    const data = await scrape(q);

    // jika gagal (success:false)
    if (!data?.success) {
      return res.reply(
        {
          success: false,
          query: q,
          provider: data?.provider || null,
          error: data?.message || 'Gagal mendapatkan lirik.'
        },
        { code: 200 } // tetap 200 agar aman dipanggil frontend
      );
    }

    // jika berhasil
    return res.reply(
      {
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
      },
      { code: 200 }
    );
  } catch (err) {
    return res.reply(
      { success: false, error: err.message || String(err) },
      { code: 500 }
    );
  }
};

// metadata tambahan biar muncul di kategori "Search"
handler.alias = 'Lyrics Finder';
handler.category = 'Search';
handler.params = {
  text: { desc: 'Judul atau potongan lirik lagu', example: 'I wanna be yours' }
};

module.exports = handler;