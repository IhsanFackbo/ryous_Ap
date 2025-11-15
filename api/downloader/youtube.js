const src = require('../../lib/scrape_file/downloader/savetube');

let handler = async (res, req) => {
  try {
    const { url, format = '360' } = req.query || {};

    if (!url || !/(youtube\.com|youtu\.be)/i.test(url)) {
      return res.reply('Invalid url.', { code: 400 });
    }

    const result = await src(url, format);
    // result sudah berisi downloadUrl + info lainnya
    return res.reply(result);

  } catch (error) {
    console.error('YT API ERROR:', error);
    return res.reply(error.message || 'Internal error', { code: 500 });
  }
};

handler.alias = 'YouTube Downloader';
handler.category = 'Downloader';
handler.status = 'active';
handler.params = {
  url: {
    desc: 'Input url from youtube.',
    example: 'https://youtu.be/Ip6cw8gfHHI'
  },
  format: {
    desc: 'Input format.',
    options: ['144', '240', '360', '480', '720', '1080', 'mp3']
  }
};

module.exports = handler;