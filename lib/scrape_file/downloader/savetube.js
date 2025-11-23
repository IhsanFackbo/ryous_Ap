// ai/ytDownloader.js
const axios = require('axios');

async function ytDownloader(url, type = 'mp4', quality = '360') {
  if (!url || !url.includes('youtu')) {
    return {
      success: false,
      message: 'URL YouTube tidak valid atau tidak diberikan.',
    };
  }

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

    // Ambil result asli dari API (bisa saja di .result, .data, atau root)
    const yt = data?.result || data?.data || data;

    if (!yt || typeof yt !== 'object') {
      return {
        success: false,
        message: 'Response API tidak valid.',
        raw: data,
      };
    }

    // COBA tebak beberapa field umum, tapi jangan dipaksa
    const meta = {
      title:
        yt.title ||
        yt.video_title ||
        yt.videoTitle ||
        yt.metadata?.title ||
        null,
      author:
        yt.author?.channelTitle ||
        yt.channel ||
        yt.channelTitle ||
        yt.uploader ||
        null,
      uploaded:
        yt.metadata?.jadwal_upload ||
        yt.published ||
        yt.uploaded ||
        yt.upload_date ||
        null,
      url: yt.url || yt.link || yt.video_url || null,
      thumbnail: yt.thumbnail || yt.thumb || yt.thumbnail_url || null,
      like: yt.metadata?.like || yt.likes || null,
      comment: yt.metadata?.comment || yt.comments || null,
      duration:
        yt.metadata?.duration ||
        yt.duration ||
        yt.length ||
        yt.length_seconds ||
        null,
    };

    const downloadUrl =
      yt.download ||
      yt.download_url ||
      yt.url_download ||
      yt.link_download ||
      null;

    return {
      success: true,
      type,
      quality: type === 'mp3' ? null : quality,
      meta,
      download: downloadUrl,
      // ini penting: lempar balik semua data mentah biar bisa dicek
      resultOriginal: yt,
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
  return ytDownloader(url, type, quality);
};