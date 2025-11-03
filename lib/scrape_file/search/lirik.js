// lib/scrape_file/search/lirik.js
const axios = require('axios');
const cheerio = require('cheerio');

function toStr(v) {
  return typeof v === 'string' ? v : (v == null ? '' : String(v));
}

async function Lirik(query) {
  try {
    const q = toStr(query).trim();
    if (!q) return { success: false, message: 'Masukkan judul lagu.' };

    // 1) Search di Musixmatch
    const searchUrl = `https://www.musixmatch.com/search/${encodeURIComponent(q)}`;
    const sres = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
      // Musixmatch kadang redirect; allow
      maxRedirects: 3,
      validateStatus: s => s >= 200 && s < 400,
    });

    const $ = cheerio.load(sres.data);

    // Ambil link pertama yang mengarah ke /lyrics/...
    let relHref =
      $('a[href*="/lyrics/"]').first().attr('href') ||
      $('div.media-card-body h2 a[href*="/lyrics/"]').first().attr('href');

    if (!relHref) {
      return { success: false, message: 'Lagu tidak ditemukan.' };
    }

    // Normalisasi URL
    if (!/^https?:\/\//i.test(relHref)) {
      relHref = 'https://www.musixmatch.com' + relHref;
    }
    const lyricUrl = relHref;

    // 2) Ambil halaman lirik
    const lres = await axios.get(lyricUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
      maxRedirects: 3,
      validateStatus: s => s >= 200 && s < 400,
    });

    const $$ = cheerio.load(lres.data);

    // title + artist (DOM → fallback meta og:title)
    let title =
      $$('h1.mxm-track-title__track').first().text().trim() ||
      $$('meta[property="og:title"]').attr('content') ||
      '';

    let artist =
      $$('a.mxm-track-title__artist').first().text().trim() ||
      $$('meta[name="author"]').attr('content') ||
      '';

    // Jika og:title format "Artist - Title Lyrics"
    if (!artist && / - .*lyrics?/i.test(title)) {
      const clean = title.replace(/\s*lyrics?\s*$/i, '');
      const idx = clean.indexOf(' - ');
      if (idx > -1) {
        artist = clean.slice(0, idx).trim();
        title = clean.slice(idx + 3).trim();
      }
    } else {
      // Bersihkan suffix "Lyrics" bila ada
      title = title.replace(/\s*lyrics?\s*$/i, '').trim();
    }

    // thumbnail dari og:image → fallback img
    let thumbnail =
      $$('meta[property="og:image"]').attr('content') ||
      $$('div.static-position img').attr('src') ||
      '';

    if (thumbnail && thumbnail.startsWith('//')) {
      thumbnail = 'https:' + thumbnail;
    }

    // 3) Ekstrak lirik:
    // Versi baru: [data-lyrics-container="true"] (tiap paragraf/baris)
    const blocks = $$('[data-lyrics-container="true"]');
    let lyrics = '';

    if (blocks.length) {
      const parts = [];
      blocks.each((_, el) => {
        const t = $$(el).text().trim();
        if (t) parts.push(t);
      });
      lyrics = parts.join('\n').trim();
    }

    // Fallback: struktur lama div.mxm-lyrics
    if (!lyrics) {
      const oldParts = [];
      $$('div.mxm-lyrics').each((_, el) => {
        const p1 = $$(el).find('span > p > span').text();
        const p2 = $$(el).find('span > div > p > span').text();
        const chunk = [p1, p2].map(s => toStr(s).trim()).filter(Boolean).join('\n');
        if (chunk) oldParts.push(chunk);
      });
      lyrics = oldParts.join('\n').trim();
    }

    if (!lyrics) {
      return { success: false, message: 'Lirik tidak ditemukan.' };
    }

    return {
      success: true,
      title: toStr(title),
      artist: toStr(artist),
      thumbnail: toStr(thumbnail),
      link: toStr(lyricUrl),
      lyrics: toStr(lyrics),
    };
  } catch (err) {
    return { success: false, message: toStr(err?.message || err) };
  }
}

module.exports = Lirik;