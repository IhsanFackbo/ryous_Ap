// lib/scrape_file/search/lirik.js
const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';
const H  = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9,id;q=0.8' };

const PREFERRED_DOMAINS = [
  'musixmatch.com',
  'genius.com',
  'azlyrics.com',
  'lyricsondemand.com',
  'lyrics.com'
];

const toStr = (v) => (v == null ? '' : String(v));

function pickPreferred(links) {
  // urutkan: domain favorit di depan
  return links
    .sort((a, b) => {
      const ia = PREFERRED_DOMAINS.findIndex(d => a.includes(d));
      const ib = PREFERRED_DOMAINS.findIndex(d => b.includes(d));
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    })[0];
}

async function searchLinks(query) {
  // DuckDuckGo HTML SERP (tanpa JS)
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query + ' lyrics')}`;
  const { data } = await axios.get(url, { headers: H, timeout: 15000, validateStatus: s => s >= 200 && s < 400 });
  const $ = cheerio.load(data);
  const links = [];
  $('a.result__a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (/^https?:\/\//i.test(href)) links.push(href);
  });
  // fallback selector
  if (!links.length) {
    $('a.result__url').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (/^https?:\/\//i.test(href)) links.push(href);
    });
  }
  return links;
}

function cleanLyricsText(txt) {
  // Hilangkan noise umum
  let t = txt.replace(/\r/g, '').split('\n').map(s => s.trimEnd()).join('\n');
  // buang baris promo panjang
  t = t.split('\n').filter(line => line.length < 400).join('\n');
  // normalisasi blank lines
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

function extractFromGenius(htmlText) {
  // Jina Reader kasih plaintext dari halaman; cari blok setelah "Lyrics"
  const idx = htmlText.indexOf('Lyrics');
  let section = idx > -1 ? htmlText.slice(idx + 'Lyrics'.length) : htmlText;
  // stopwords umum di Genius
  const stops = ['Embed', 'You might also like', 'More on Genius'];
  for (const s of stops) {
    const i = section.indexOf(s);
    if (i > 80) { section = section.slice(0, i); break; }
  }
  return cleanLyricsText(section);
}

function extractFromMusixmatch(htmlText) {
  // Cari kumpulan baris yang mirip lirik (banyak newline berturut-turut)
  // Ambil blok terpanjang
  const chunks = htmlText.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  let best = '';
  for (const c of chunks) {
    // heuristik: banyak baris pendek
    const lines = c.split('\n');
    const score = lines.filter(l => l.length > 0 && l.length <= 120).length;
    if (score > best.split('\n').length) best = c;
  }
  return cleanLyricsText(best);
}

function extractGeneric(htmlText) {
  return cleanLyricsText(htmlText);
}

async function fetchViaReader(targetUrl) {
  // Jina reader: bypass bot/JS
  const u = `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//i, '')}`;
  const { data } = await axios.get(u, { headers: H, timeout: 20000, validateStatus: s => s >= 200 && s < 400 });
  return toStr(data || '');
}

async function lirik(query) {
  try {
    const q = toStr(query).trim();
    if (!q) return { success: false, message: 'Parameter kosong.' };

    // 1) cari link
    const links = await searchLinks(q);
    if (!links.length) return { success: false, message: 'Tidak ada hasil pencarian.' };

    const chosen = pickPreferred(links);
    if (!chosen) return { success: false, message: 'Link yang cocok tidak ditemukan.' };

    // 2) ambil konten via r.jina.ai
    const raw = await fetchViaReader(chosen);
    if (!raw) return { success: false, message: 'Gagal memuat halaman (reader).' };

    // 3) ekstraksi
    let lyrics = '';
    if (chosen.includes('genius.com')) lyrics = extractFromGenius(raw);
    else if (chosen.includes('musixmatch.com')) lyrics = extractFromMusixmatch(raw);
    else lyrics = extractGeneric(raw);

    if (!lyrics || lyrics.split('\n').length < 3) {
      return { success: false, message: 'Lirik tidak berhasil diekstrak.' };
    }

    // title / artist sederhana dari URL
    let title = q;
    let artist = '';
    if (chosen.includes('genius.com')) {
      // format: https://genius.com/Artist-title-lyrics
      const m = chosen.match(/genius\.com\/([^/]+)-([^/]+)-lyrics/i);
      if (m) {
        artist = decodeURIComponent(m[1]).replace(/-/g, ' ');
        title  = decodeURIComponent(m[2]).replace(/-/g, ' ');
      }
    }

    return {
      success: true,
      provider: new URL(chosen).hostname,
      query: q,
      title,
      artist,
      link: chosen,
      thumbnail: '',
      lyrics
    };
  } catch (e) {
    return { success: false, message: toStr(e?.message || e) };
  }
}

module.exports = lirik;