// ai/lyrics.js
const axios = require('axios');
const cheerio = require('cheerio');

// =======================
// CLEANER HTML → LYRICS
// =======================
function extractLyrics(html) {
  if (!html || typeof html !== 'string') return null;

  const $ = cheerio.load(html);

  $('script,style,noscript').remove();

  const clean = (f) => {
    if (!f) return '';
    let s = String(f)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|p|li|section|article|header|footer)[^>]*>/gi, '\n')
      .replace(/<img[^>]*>/gi, '')
      .replace(/<\/?[^>]+>/g, '');
    s = cheerio.load(`<div>${s}</div>`)('div').text();
    return s
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  };

  const selectors = [
    '[data-lyrics-container="true"]',
    'div[class*="Lyrics__Container"]',
    '.song_body-lyrics',
    '.lyrics__root'
  ];

  for (const s of selectors) {
    const el = $(s);
    if (!el.length) continue;

    const parts = [];
    el.each((i, e) => {
      const txt = clean($(e).html());
      if (txt) parts.push(txt);
    });

    const text = parts.join('\n\n').trim();
    if (text.length > 50) return text;
  }

  return null;
}

// =======================
// DUCKDUCKGO BACKUP
// =======================
async function findGeniusBackup(q) {
  const search = encodeURIComponent(`${q} site:genius.com`);
  const url = `https://duckduckgo.com/html/?q=${search}`;

  const r = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*'
    }
  });

  const $ = cheerio.load(r.data);

  let link = null;
  $('a').each((i, e) => {
    const href = $(e).attr('href') || '';
    if (href.includes('genius.com')) {
      link = href;
    }
    if (href.startsWith('/l/?') && href.includes('uddg=')) {
      const m = href.match(/uddg=([^&]+)/);
      if (m?.[1]) {
        const d = decodeURIComponent(m[1]);
        if (d.includes('genius.com')) link = d;
      }
    }
  });

  return link;
}

// =======================
// MAIN SEARCH FUNCTION
// =======================
async function searchLyrics(query) {
  if (!query) throw new Error('Query is required.');

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json,text/plain,*/*',
    'Referer': 'https://genius.com/',
    'Origin': 'https://genius.com'
  };

  try {
    const api = `https://genius.com/api/search/multi?q=${encodeURIComponent(query)}`;

    let r = await axios.get(api, { headers: HEADERS });
    let j = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;

    const sec = j?.response?.sections?.find((s) => s.type === 'song');
    if (!sec?.hits?.length) throw new Error('Song not found');

    const song = sec.hits[0].result;

    // fetch page
    const pg = await axios.get(song.url, {
      headers: { 'User-Agent': HEADERS['User-Agent'] }
    });

    const lyrics = extractLyrics(pg.data);

    return {
      success: true,
      title: song.full_title,
      thumbnail: song.song_art_image_url,
      url: song.url,
      lyrics: lyrics || null
    };
  } catch (err) {
    // fallback DuckDuckGo
    if (err?.response?.status === 403 || err?.message?.includes('403')) {
      const link = await findGeniusBackup(query);

      return {
        success: true,
        title: query,
        thumbnail: null,
        url: link,
        lyrics: link ? `Preview blocked. Buka: ${link}` : null
      };
    }

    return {
      success: false,
      error: err.message
    };
  }
}

// EXPORT → scrape('ai/lyrics')
module.exports = async (q) => {
  return searchLyrics(q);
};