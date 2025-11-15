// lib/scrape_file/downloader/youtube.js

// Beberapa instance Piped API (pilih yang hidup)
const PIPED_INSTANCES = [
  'https://pipedapi.r4fox.dev',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.integon.dev',
  'https://pipedapi.kavin.rocks'
];

// ───────────────────────── helpers ─────────────────────────

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

  try {
    const u = new URL(link);
    const v = u.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  } catch (_) {}

  return null;
}

function formatDuration(sec) {
  const s = Number(sec) || 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// fetch JSON + failover ke instance berikutnya kalau error/521/dll
async function fetchJsonFailover(path) {
  const errors = [];

  for (const base of PIPED_INSTANCES) {
    const url = base + path;
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (YouTube-Downloader-API)',
          'accept': 'application/json'
        }
      });

      if (!res.ok) {
        errors.push(`${base} -> ${res.status}`);
        continue;
      }

      const data = await res.json();
      return { data, base };
    } catch (e) {
      errors.push(`${base} -> ${e.name || 'ERR'}`);
      continue;
    }
  }

  throw new Error(
    'All Piped instances unreachable: ' + errors.join(' | ')
  );
}

// pilih stream sesuai format
function pickStream(data, format) {
  if (format === 'mp3') {
    const audios = data.audioStreams || [];
    if (!audios.length) throw new Error('Audio stream not found.');

    const best = audios.reduce((a, b) =>
      (a.bitrate || 0) > (b.bitrate || 0) ? a : b
    );

    return { type: 'audio', stream: best };
  }

  const target = parseInt(format, 10);
  if (!Number.isFinite(target)) throw new Error('Invalid format.');

  let videos = (data.videoStreams || []).filter(
    v => v && v.url && v.mimeType && v.mimeType.startsWith('video/')
  );
  if (!videos.length) throw new Error('Video stream not found.');

  videos = videos.sort((a, b) => (a.height || 0) - (b.height || 0));

  // cari kualitas <= target, kalau nggak ada ambil yang terdekat
  const under = videos.filter(v => v.height && v.height <= target);
  const chosen = under.length ? under[under.length - 1] : videos[0];

  return { type: 'video', stream: chosen };
}

// ────────────────────── SCRAPE UTAMA ───────────────────────

/**
 * scrapeYoutube(link, format?)
 *
 * format: '144','240','360','480','720','1080','mp3'
 * return:
 * {
 *   success, id, title, uploader, duration, thumbnail,
 *   type, requestedFormat, quality, mime, downloadUrl
 * }
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

  // ambil info video dengan auto-failover
  const { data, base } = await fetchJsonFailover(`/streams/${id}`);

  const { type, stream } = pickStream(data, format);
  if (!stream || !stream.url) throw new Error('Download URL not found.');

  const title = data.title || 'Unknown title';
  const duration = formatDuration(data.duration);
  const thumbnail =
    data.thumbnailUrl ||
    (data.proxyUrl ? `${data.proxyUrl}/vi/${id}/maxresdefault.jpg` : '');

  return {
    success: true,
    from: base,            // instance mana yang dipakai
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