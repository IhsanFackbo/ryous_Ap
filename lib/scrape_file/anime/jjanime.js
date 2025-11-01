// lib/scrape_file/anime/jjanime.js
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://jjanime.biz'; // jika domain berubah, ganti saja di sini

function abs(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return BASE.replace(/\/+$/, '') + '/' + String(u).replace(/^\/+/, '');
}

async function randomJJAnime() {
  const query = 'jedag jedug anime';
  const url = `${BASE}/?s=${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const $ = cheerio.load(data);
  const results = [];

  // ambil daftar video atau post
  $('.animepost, article, .post-show li').each((_, el) => {
    const a = $(el).find('a').first();
    const img =
      $(el).find('img').attr('data-src') ||
      $(el).find('img').attr('src') ||
      null;
    const title =
      a.attr('title') ||
      $(el).find('.tt, .entry-title').text().trim() ||
      a.text().trim();
    const href = a.attr('href');
    if (href && title && img) {
      results.push({
        title: title.trim(),
        image: abs(img),
        url: abs(href),
      });
    }
  });

  if (!results.length) throw new Error('Tidak ditemukan hasil untuk "jedag jedug anime".');

  // ambil 1–3 hasil acak
  const shuffled = results.sort(() => 0.5 - Math.random());
  const picked = shuffled.slice(0, Math.min(3, shuffled.length));
  return picked;
}

module.exports = { randomJJAnime };