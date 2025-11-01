const axios = require('axios');
const cheerio = require('cheerio');

class Samehadaku {
  async search(text) {
    const { data } = await axios.get("https://samehadaku.email");
    const $ = cheerio.load(data);
    const script = $("#live_search-js-extra").html() || '';
    const nonce = script.match(/"nonce":"([^"]+)"/)?.[1];
    if (!nonce) throw new Error("Failed to get nonce");

    const res = await axios.get(`https://samehadaku.email/wp-json/eastheme/search/?keyword=${encodeURIComponent(text)}&nonce=${nonce}`);
    return Object.values(res.data);
  }

  async detail(url) {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("h1.entry-title").text().trim();
    const rating = $('.rtg span[itemprop="ratingValue"]').text().trim();
    const image = $(".thumb img").attr("src");
    const desc = $(".entry-content-single").text().trim();
    const genres = $(".genre-info a").map((_, e) => $(e).text().trim()).get();
    const episodes = $(".lstepsiode.listeps li").map((_, el) => ({
      title: $(el).find(".epsleft .lchx a").text().trim(),
      url: $(el).find(".epsleft .lchx a").attr("href"),
      date: $(el).find(".epsleft .date").text().trim()
    })).get();

    return { title, rating, image, desc, genres, episodes };
  }
}

module.exports = new Samehadaku();
