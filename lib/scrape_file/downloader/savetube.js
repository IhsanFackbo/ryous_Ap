// lib/scrape_file/downloader/youtube.js

const BASE_URL = 'https://pipedapi.kavin.rocks';

// ambil id dari link YouTube
function extractId(link) {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/
  ];

  for (const p of patterns) {
    const m = link.match(p);
    if (m && m[1]) return m[1];
  }

  // fallback pakai URLSearchParams kalau bisa
  try {
    const u = new URL(link);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
  } catch (_) {}

  return null;
}

function formatDuration(sec) {
  const s = Number(sec) || 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (YouTube-Downloader-API)',
      'accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Upstream error (${res.status})`);
  }

  return res.json();
}

// pilih stream sesuai format
function pickStream(data, format) {
  if (format === 'mp3') {
    const audios = data.audioStreams || [];
    if (!audios.length) throw new Error('Audio stream not found.');

    // pilih bitrate terbesar
    return {
      type: 'audio',
      stream: audios.reduce((a, b) => (a.bitrate > b.bitrate ? a : b))
    };
  }

  const target = parseInt(format, 10);
  if (Number.isNaN(target)) throw new Error('Invalid format.');

  let videos = (data.videoStreams || []).filter(
    v => v && v.url && v.mimeType && v.mimeType.startsWith('video/')
  );

  if (!videos.length) throw new Error('Video stream not found.');

  // sort by height
  videos = videos.sort((a, b) => (a.height || 0) - (b.height || 0));

  // cari <= target
  let chosen =
    videos.filter(v => v.height && v.height <= target).slice(-1)[0] ||
    videos[0];

  return { type: 'video', stream: chosen };
}

/**
 * SCRAPE UTAMA
 * dipanggil lewat: const yt = require('.../youtube'); await yt(url, format)
 *
 * format yang didukung:
 *   '144','240','360','480','720','1080','mp3'
 */
module.exports = async function scrapeYoutube(link, format = '360') {
  const allowed = ['144', '240', '360', '480', '720', '1080', 'mp3'];
  if (!allowed.includes(format)) {
    throw new Error(`Available formats: ${allowed.join(', ')}`);
  }

  if (!/^https?:\/\//i.test(link)) {
    throw new Error('Invalid url.');
  }

  const id = extractId(link);
  if (!id) throw new Error('Failed to extract video id.');

  const data = await fetchJson(`${BASE_URL}/streams/${id}`);

  const { type, stream } = pickStream(data, format);
  if (!stream || !stream.url) throw new Error('Download URL not found.');

  const title = data.title || 'Unknown title';
  const duration = formatDuration(data.duration);
  const thumbnail =
    data.thumbnailUrl ||
    (data.proxyUrl ? `${data.proxyUrl}/vi/${id}/maxresdefault.jpg` : '');

  return {
    success: true,
    id,
    title,
    uploader: data.uploader || '',
    duration,
    thumbnail,
    type,
    requestedFormat: format,
    quality: stream.quality || (type === 'audio' ? 'audio' : `${stream.height}p`),
    mime: stream.mimeType || (type === 'audio' ? 'audio/mpeg' : 'video/mp4'),
    downloadUrl: stream.url
  };
};