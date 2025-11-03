// lib/scrape_file/search/lirik.js
const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const H = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9,id;q=0.8' };

const toStr = v => (v == null ? '' : String(v));

async function lirik(query) {
  try {
    const q = toStr(query).trim();
    if (!q) return { success: false, message: 'Masukkan judul lagu.' };

    // 1) SEARCH
    const sUrl = `https://www.musixmatch.com/search/${encodeURIComponent(q)}`;
    const sRes = await axios.get(sUrl, { headers: H, maxRedirects: 3, validateStatus: s => s >= 200 && s < 400 });
    const $ = cheerio.load(sRes.data);

    // cari link ke /lyrics/ ... (beberapa kemungkinan selector)
    let rel =
      $('a[href*="/lyrics/"]').first().attr('href') ||
      $('div.media-card-body h2 a[href*="/lyrics/"]').first().attr('href') ||
      $('h2 a.mxm-track-title__track[href*="/lyrics/"]').first().attr('href');

    if (!rel) return { success: false, message: 'Lirik tidak ditemukan (search kosong).' };

    if (!/^https?:\/\//i.test(rel)) rel = 'https://www.musixmatch.com' + rel;
    const lyricUrl = rel;

    // 2) PAGE LIRIK
    const lRes = await axios.get(lyricUrl, { headers: H, maxRedirects: 3, validateStatus: s => s >= 200 && s < 400 });
    const $$ = cheerio.load(lRes.data);

    // title + artist
    let title =
      $$('h1.mxm-track-title__track').first().text().trim() ||
      $$('meta[property="og:title"]').attr('content') || '';
    let artist =
      $$('a.mxm-track-title__artist').first().text().trim() ||
      $$('meta[name="author"]').attr('content') || '';

    // bersihkan format "Artist - Title Lyrics"
    if (!artist && / - .*lyrics?/i.test(title)) {
      const clean = title.replace(/\s*lyrics?\s*$/i, '');
      const i = clean.indexOf(' - ');
      if (i > -1) {
        artist = clean.slice(0, i).trim();
        title = clean.slice(i + 3).trim();
      }
    } else {
      title = title.replace(/\s*lyrics?\s*$/i, '').trim();
    }

    // thumbnail
    let thumbnail = $$('meta[property="og:image"]').attr('content') || $$('div.static-position img').attr('src') || '';
    if (thumbnail && thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;

    // 3) LYRICS (versi baru + fallback)
    let lyrics = '';
    const blocks = $$('[data-lyrics-container="true"]');
    if (blocks.length) {
      const parts = [];
      blocks.each((_, el) => {
        const t = $$(el).text().trim();
        if (t) parts.push(t);
      });
      lyrics = parts.join('\n').trim();
    }
    if (!lyrics) {
      const old = [];
      $$('div.mxm-lyrics').each((_, el) => {
        const p1 = $$(el).find('span > p > span').text();
        const p2 = $$(el).find('span > div > p > span').text();
        const chunk = [p1, p2].map(s => toStr(s).trim()).filter(Boolean).join('\n');
        if (chunk) old.push(chunk);
      });
      lyrics = old.join('\n').trim();
    }

    if (!lyrics) return { success: false, message: 'Lirik tidak ditemukan (halaman kosong).' };

    return {
      success: true,
      title: toStr(title),
      artist: toStr(artist),
      thumbnail: toStr(thumbnail),
      link: toStr(lyricUrl),
      lyrics: toStr(lyrics)
    };
  } catch (e) {
    return { success: false, message: toStr(e?.message || e) };
  }
}

module.exports = lirik;