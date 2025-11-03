// lib/scrape_file/search/lirik.js
const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';
const H  = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9,id;q=0.8' };

const toStr = v => (v == null ? '' : String(v));

async function fetchViaReader(targetUrl) {
  const u = `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//i, '')}`;
  const res = await axios.get(u, { headers: H, timeout: 20000, validateStatus: s => s >= 200 && s < 400 });
  return toStr(res.data || '');
}

/** ====== SEARCH LINKS ====== */
async function searchByGeniusAPI(q) {
  const url = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(q)}`;
  const res = await axios.get(url, { headers: H, timeout: 15000, validateStatus: s => s >= 200 && s < 400 });
  const sections = res.data?.response?.sections || [];
  for (const sec of sections) {
    if (sec.type === 'song') {
      const hits = sec.hits || [];
      if (hits.length) {
        const url = hits[0]?.result?.url;
        if (url) return url;
      }
    }
  }
  return null;
}

async function searchByLyricsCom(q) {
  const url = `https://www.lyrics.com/lyrics/${encodeURIComponent(q)}`;
  const html = await fetchViaReader(url);          // lewat Jina Reader
  const $ = cheerio.load(html);
  // list hasil biasanya di .sec-lyric > .clearfix > h3 > a
  let link = $('div.sec-lyric div.clearfix h3 a').first().attr('href');
  if (!link) link = $('div.lyrics-list a').first().attr('href'); // fallback
  if (!link) return null;
  return `https://www.lyrics.com${link}`;
}

/** ====== EXTRACTORS ====== */
function cleanLyricsText(txt) {
  let t = txt.replace(/\r/g, '').split('\n').map(s => s.trimEnd()).join('\n');
  t = t.split('\n').filter(line => line.length < 400).join('\n');
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return t;
}
function extractFromGenius(plain) {
  // ambil blok setelah kata "Lyrics"
  const idx = plain.indexOf('Lyrics');
  let section = idx > -1 ? plain.slice(idx + 'Lyrics'.length) : plain;
  const stops = ['Embed', 'You might also like', 'More on Genius'];
  for (const s of stops) {
    const i = section.indexOf(s);
    if (i > 80) { section = section.slice(0, i); break; }
  }
  return cleanLyricsText(section);
}
function extractGeneric(plain) {
  // cari blok ter-“lyric”: banyak baris pendek
  const chunks = plain.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  let best = '';
  for (const c of chunks) {
    const sc = c.split('\n').filter(l => l && l.length <= 120).length;
    if (sc > best.split('\n').length) best = c;
  }
  return cleanLyricsText(best || plain);
}

/** ====== MAIN ====== */
async function lirik(query) {
  try {
    const q = toStr(query).trim();
    if (!q) return { success: false, message: 'Parameter kosong.' };

    // 1) coba Genius API dulu (tanpa 403)
    let target = await searchByGeniusAPI(q);

    // 2) fallback ke Lyrics.com
    if (!target) target = await searchByLyricsCom(q);
    if (!target) return { success: false, message: 'Tidak ada hasil pencarian.' };

    // 3) ambil plaintext via Jina Reader
    const plain = await fetchViaReader(target);
    if (!plain) return { success: false, message: 'Gagal memuat halaman.' };

    // 4) ekstrak lirik
    let lyrics = target.includes('genius.com') ? extractFromGenius(plain) : extractGeneric(plain);
    lyrics = cleanLyricsText(lyrics);

    if (!lyrics || lyrics.split('\n').length < 3)
      return { success: false, message: 'Lirik tidak berhasil diekstrak.' };

    // judul & artist sederhana
    let title = q, artist = '';
    if (target.includes('genius.com')) {
      const m = target.match(/genius\.com\/([^/]+)-([^/]+)-lyrics/i);
      if (m) { artist = decodeURIComponent(m[1]).replace(/-/g, ' '); title = decodeURIComponent(m[2]).replace(/-/g, ' '); }
    }

    return {
      success: true,
      provider: new URL(target).hostname,
      query: q,
      title, artist,
      link: target,
      thumbnail: '',
      lyrics
    };
  } catch (e) {
    return { success: false, message: toStr(e?.message || e) };
  }
}

module.exports = lirik;