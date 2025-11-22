const src = scrape('anime/kurama');

let handler = async (res, req) => {
  try {
    const { q, page = 1, order_by = 'latest' } = req.query;

    if (!q) {
      return res.reply(
        { success: false, error: 'Parameter q (query) wajib diisi.' },
        { code: 400 }
      );
    }

    const data = await src.search(q, Number(page), order_by);

    return res.reply({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Kurama Search Error:', error);

    const msg = typeof error === 'string'
      ? error
      : error?.message || JSON.stringify(error);

    return res.reply(
      { success: false, error: msg },
      { code: 500 }
    );
  }
};

handler.alias = 'Kurama Search';
handler.category = 'Anime';
handler.params = {
  q: { desc: 'Kata kunci pencarian', example: 'one piece' },
  page: { desc: 'Halaman', example: '1' },
  order_by: { desc: 'Urutkan (latest, dsb)', example: 'latest' }
};

module.exports = handler;