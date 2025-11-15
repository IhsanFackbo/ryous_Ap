const src = require('../../lib/scrape_file/downloader/savetube');

let handler = async (req, res) => {
  try {
    const { url, format = '360p' } = req.query;

    if (!url || !/(youtube\.com|youtu\.be)/.test(url)) {
      return res.reply('Invalid url.', { code: 400 });
    }

    const result = await src(url, format);

    return res.reply(result);
  } catch (error) {
    return res.reply(error.message, { code: 500 });
  }
};

handler.alias = 'YouTube Downloader';
handler.category = 'Downloader';
handler.status = 'active';
handler.params = {
  url: {
    desc: 'Input url from youtube.',
    example: 'https://youtu.be/xxxxxx'
  },
  format: {
    desc: 'Choose format.',
    options: ['128k', '320k', '144p', '240p', '360p', '720p', '1080p']
  }
};

module.exports = handler;