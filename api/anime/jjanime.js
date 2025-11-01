// api/anime/jjanime.js
const src = require('../../lib/scrape_file/anime/jjanime');


let handler = async (res, req) => {
  try {
    const { text } = req.query || {};
    if (!text || !text.trim()) {
      return res.reply({ success: false, error: 'Missing "text" query' }, { code: 400 });
    }

    const result = await src.search(text.trim());
    return res.reply({ success: true, count: result.length, result });
  } catch (error) {
    return res.reply({ success: false, error: error.message }, { code: 500 });
  }
};

handler.alias = 'JJ Anime Search';
handler.category = 'Anime';
handler.params = {
  text: { desc: 'Kata kunci anime untuk dicari', example: 'Naruto' },
};

module.exports = handler;