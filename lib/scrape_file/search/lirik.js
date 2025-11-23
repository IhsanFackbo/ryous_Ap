// ai/lyrics.js
// Simple multi-site lyrics scraper (Genius, AZLyrics, Lyrics.com, fallback generic)
// By: ChatGPT x Vanzel

const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const http = axios.create({
  headers: {
    'User-Agent': UA,
    'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8',
  },
  timeout: 15000,
});

// 🔍 Cari link lirik pakai DuckDuckGo
async function searchDuckDuckGo(query) {
  const q = encodeURIComponent(`${query} lyrics`);
  const url = `https://duckduckgo.com/html/?q=${q}`;

  const { data: html } = await http.get(url);
  const $ = cheerio.load(html);

  const candidates = [];
  $('a').each((_, el) => {
    let href = $(el).attr('href') || '';

    if (href.startsWith('/l/?') && href.includes('uddg=')) {
      const m = href.match(/uddg=([^&]+)/);
      if (m?.[1]) {
        href = decodeURIComponent(m[1]);
      }
    }

    if (!href.startsWith('http')) return;

    const domain = new URL(href).hostname.replace(/^www\./, '');

    // whitelist domain lirik
    const allowed = [
      'genius.com',
      'azlyrics.com',
      'lyrics.com',
      'metrolyrics.com',
      'songlyrics.com',
    ];

    if (allowed.some(d => domain.endsWith(d))) {
      candidates.push({ url: href, domain });
    }
  });

  return candidates;
}

// 🧽 Util: bersihin text
function cleanText(txt) {
  if (!txt) return '';
  return String(txt)
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

// 🔎 Extract dari Genius
function extractFromGenius(html) {
  const $ = cheerio.load(html);
  $('[script],[style],noscript').remove();

  let parts = [];

  $('[data-lyrics-container="true"], div[class*="Lyrics__Container"]').each((_, el) => {
    let s = $(el).html() || '';
    s = s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|p|section|article|span)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    parts.push(s);
  });

  if (!parts.length) {
    // fallback generic
    const text = $('body').text();
    parts.push(text);
  }

  const joined = cleanText(parts.join('\n\n'));
  const title =
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    'Unknown Title';

  return { title, lyrics: joined };
}

// 🔎 Extract dari AZLyrics
function extractFromAZLyrics(html) {
  const $ = cheerio.load(html);
  $('[script],[style],noscript]').remove();

  // AZLyrics biasanya div tanpa class di tengah
  let lyricsNode = null;
  $('div').each((_, el) => {
    const id = $(el).attr('id');
    const cls = $(el).attr('class');
    const text = $(el).text();
    if (!id && !cls && text && text.length > 100) {
      lyricsNode = $(el);
      return false;
    }
  });

  if (!lyricsNode) lyricsNode = $('body');

  let htmlLyrics = lyricsNode.html() || '';
  htmlLyrics = htmlLyrics
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|span)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  const lyrics = cleanText(htmlLyrics);
  const title =
    $('b').first().text().trim().replace(/"|\s+lyrics?/gi, '') ||
    $('title').text().trim() ||
    'Unknown Title';

  return { title, lyrics };
}

// 🔎 Extract dari Lyrics.com
function extractFromLyricsDotCom(html) {
  const $ = cheerio.load(html);
  $('[script],[style],noscript]').remove();

  const block = $('#lyric-body-text');
  const text = block.length ? block.text() : $('body').text();
  const lyrics = cleanText(text);

  const title =
    $('.lyric-title').text().trim() ||
    $('title').text().trim() ||
    'Unknown Title';

  return { title, lyrics };
}

// 🔎 Extract generic kalau domain tidak dikenal
function extractGeneric(html) {
  const $ = cheerio.load(html);
  $('[script],[style],noscript]').remove();

  const bodyText = $('body').text();
  const lines = bodyText
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 3);

  // Ambil bagian tengah (biar gak terlalu banyak header/footer)
  const mid = Math.floor(lines.length / 2);
  const slice = lines.slice(mid - 80, mid + 80); // sekitar 160 baris max
  const lyrics = cleanText(slice.join('\n'));

  const title = $('title').text().trim() || 'Unknown Title';

  return { title, lyrics };
}

// 🎵 Main function scrape
async function scrapeLyrics(query) {
  if (!query || !query.trim()) {
    return {
      status: false,
      msg: 'Query (judul lagu) wajib diisi',
    };
  }

  try {
    const candidates = await searchDuckDuckGo(query);

    if (!candidates.length) {
      return {
        status: false,
        msg: 'Tidak menemukan halaman lirik yang cocok dari DuckDuckGo',
      };
    }

    // pakai kandidat pertama dulu
    const target = candidates[0];
    const { url, domain } = target;

    const { data: html } = await http.get(url);

    let extracted;
    if (domain.endsWith('genius.com')) {
      extracted = extractFromGenius(html);
    } else if (domain.endsWith('azlyrics.com')) {
      extracted = extractFromAZLyrics(html);
    } else if (domain.endsWith('lyrics.com')) {
      extracted = extractFromLyricsDotCom(html);
    } else {
      extracted = extractGeneric(html);
    }

    if (!extracted || !extracted.lyrics || extracted.lyrics.length < 20) {
      return {
        status: false,
        msg: 'Berhasil buka halaman tapi gagal ekstrak lirik',
        source: { url, domain },
      };
    }

    return {
      status: true,
      query,
      source: { url, domain },
      result: {
        title: extracted.title,
        lyrics: extracted.lyrics,
      },
    };
  } catch (err) {
    return {
      status: false,
      msg: err?.message || String(err),
    };
  }
}

// export untuk sistem scrape('ai/lyrics')
module.exports = async function (q) {
  return scrapeLyrics(q);
};