// api/search/lirik.js
const scrape = require('../../lib/scrape');
const src = scrape('search/lirik'); // arahkan ke file: lib/scrape_file/search/lirik.js

let handler = async (res, req) => {
  try {
    const q = (req?.query?.text || '').trim();

    if (!q) {
      return res.reply(
        { success: false, error: 'Masukkan judul lagu pada parameter ?text=' },
        { code: 400 }
      );
    }

    const data = await src(q);

    // Tangani hasil yang tidak valid / kosong
    if (!data || data.success === false) {
      return res.reply(
        { success: false, error: String(data?.message || 'Lirik tidak ditemukan.') },
        { code: 404 }
      );
    }

    // Pastikan setiap field dikonversi menjadi string (anti [object Object])
    return res.reply({
      success: true,
      result: {
        title: String(data.title || ''),
        artist: String(data.artist || ''),
        thumbnail: String(data.thumbnail || ''),
        link: String(data.link || ''),
        lyrics: String(data.lyrics || '')
      }
    });
  } catch (err) {
    const msg = err?.message ? String(err.message) : String(err);
    return res.reply({ success: false, error: msg }, { code: 500 });
  }
};

// Metadata
handler.alias = 'Musixmatch Lirik';
handler.category = 'Search'; // ✅ kategori sudah diset sesuai permintaan
handler.params = {
  text: { desc: 'Judul lagu untuk dicari liriknya', example: 'Perfect - Ed Sheeran' }
};

module.exports = handler;