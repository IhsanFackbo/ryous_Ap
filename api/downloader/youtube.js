const src = require('../../lib/scrape_file/downloader/savetube');

let handler = async (req, res) => {
  try {
    const { url, format = '360p', apikey } = req.query;

    // (optional) cek API key kalau mau
    // if (apikey !== process.env.YT_API_KEY) {
    //   return res.reply('Invalid API key.', { code: 401 });
    // }

    if (!url || !/(youtube\.com|youtu\.be)/.test(url)) {
      return res.reply('Invalid url.', { code: 400 });
    }

    console.time('YT_SCRAPE');
    const result = await src(url, format);
    console.timeEnd('YT_SCRAPE'); // kelihatan di log berapa detik

    return res.reply(result);
  } catch (error) {
    return res.reply(error.message, { code: 500 });
  }
};

handler.alias = 'YouTube Downloader';
handler.category = 'Downloader';
handler.status = 'active';
handler.params = {
  url: { desc: 'Input url from youtube.', example: 'https://youtu.be/xxxxxx' },
  format: { desc: 'Input format.', options: ['128k','320k','144p','240p','360p','720p','1080p'] }
};

module.exports = handler;