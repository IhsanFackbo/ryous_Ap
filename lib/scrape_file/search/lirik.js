// lib/scrape_file/music/Lirik.js
const axios = require("axios");
const cheerio = require("cheerio");

async function Lirik(judul) {
  try {
    if (!judul) throw new Error("Masukkan judul lagu untuk dicari.");

    const searchUrl = `https://www.musixmatch.com/search/${encodeURIComponent(judul)}`;
    const { data } = await axios.get(searchUrl);
    const $ = cheerio.load(data);

    const baseUrl = "https://www.musixmatch.com";
    const link = baseUrl + $("div.media-card-body > div > h2 a").attr("href");

    if (!link || !link.includes("/lyrics/")) {
      return { success: false, message: "Lagu tidak ditemukan." };
    }

    const { data: lyricPage } = await axios.get(link);
    const $$ = cheerio.load(lyricPage);

    const thumb =
      "https:" +
      ($$("div.col-sm-1.col-md-2.col-ml-3.col-lg-3.static-position img").attr("src") ||
        "");

    let lirik = "";
    $$("div.mxm-lyrics").each((_, el) => {
      const part1 = $$(el).find("span > p > span").text();
      const part2 = $$(el).find("span > div > p > span").text();
      lirik += part1 + "\n" + part2;
    });

    if (!lirik) return { success: false, message: "Lirik tidak ditemukan." };

    return {
      success: true,
      title: $("div.media-card-body > div > h2 a").text().trim(),
      link,
      thumbnail: thumb,
      lyrics: lirik.trim(),
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = Lirik;