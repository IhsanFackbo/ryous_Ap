// api/anime/samehadaku.js
// Handler API untuk pencarian anime via Samehadaku scraper

const scrape = require('../../lib/scrape_file'); // loader universal
const src = scrape('anime/Sameheda'); // ambil scraper file: lib/scrape_file/anime/Sameheda.js

async function handler(req, res) {
  try {
    // support vercel-style dan express-style
    const query = req.query || {};
    const q = (query.text || 'One Piece').trim();

    // panggil scraper
    const data = await src.search(q);

    // kirim hasil ke client
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      source: 'samehadaku',
      query: q,
      result: data
    }));
  } catch (e) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: e.message
    }));
  }
}

// metadata opsional (berguna kalau sistem API kamu auto-register handler)
handler.alias = 'Samehadaku';
handler.category = 'Anime';
handler.params = {
  text: { desc: 'Judul anime untuk dicari', example: 'One Piece' }
};

module.exports = handler;
