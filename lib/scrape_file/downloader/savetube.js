// ai/ytDownloader.js
const axios = require('axios');

async function ytDownloader({ url, type = 'mp4', quality = '360' }) {
  if (!url || !url.includes('youtu')) {
    return {
      success: false,
      message: 'URL YouTube tidak valid atau tidak diberikan.',
    };
  }

  // validasi type & quality
  const allowedType = ['mp4', 'mp3'];
  if (!allowedType.includes(type)) {
    return {
      success: false,
      message: 'Tipe hanya boleh: mp4 atau mp3.',
    };
  }

  const allowedQuality = ['360', '720', '1080'];
  if (type === 'mp4' && !allowedQuality.includes(quality)) {
    return {
      success: false,
      message: 'Quality tersedia hanya: ' + allowedQuality.join(', '),
    };
  }

  try {
    const params = new URLSearchParams({
      url,
      format: type === 'mp3' ? 'mp3' : quality,
    });

    const { data } = await axios.get(
      'https://api.ootaizumi.web.id/downloader/youtube?' + params.toString(),
      { timeout: 20000 }
    );

    // asumsi struktur sama dengan yg di bot: { result: {...} }
    const yt = data?.result;
    if (!yt) {
      return {
        success: false,
        message: 'Response API tidak valid.',
        raw: data,
      };
    }

    return {
      success: true,
      type,
      quality: type === 'mp3' ? null : quality,
      meta: {
        title: yt.title || null,
        author: yt.author?.channelTitle || null,
        uploaded: yt.metadata?.jadwal_upload || null,
        url: yt.url || null,
        thumbnail: yt.thumbnail || null,
        like: yt.metadata?.like || null,
        comment: yt.metadata?.comment || null,
        duration: yt.metadata?.duration || null,
      },
      download: yt.download || null, // direct download URL dari API
    };
  } catch (e) {
    return {
      success: false,
      message: e?.message || String(e),
    };
  }
}

// dipanggil lewat scrape('ai/ytDownloader')
module.exports = async (url, type = 'mp4', quality = '360') => {
  return ytDownloader({ url, type, quality });
};