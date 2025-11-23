// ai/fbDownloader.js
// Facebook video downloader (HD/SD extractor)
// Return selalu JSON simple, tanpa throw

const axios = require("axios");

async function fbDownloader(url) {
  if (!url || !url.includes("facebook.com")) {
    return {
      success: false,
      message: 'URL Facebook tidak valid atau kosong.'
    };
  }

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
    };

    const { data: html } = await axios.get(url, { headers });

    // Ambil HD & SD
    const hd =
      html.match(/"browser_native_hd_url":"(.*?)"/)?.[1]?.replace(/\\\//g, "/") ||
      null;

    const sd =
      html.match(/"browser_native_sd_url":"(.*?)"/)?.[1]?.replace(/\\\//g, "/") ||
      null;

    if (!hd && !sd) {
      return {
        success: false,
        message: "Gagal menemukan link HD/SD. Video mungkin private / region locked / layout FB berubah."
      };
    }

    return {
      success: true,
      hd,
      sd,
      source: url
    };
  } catch (err) {
    return {
      success: false,
      message: err?.message || String(err)
    };
  }
}

// dipanggil pakai: const fb = scrape('ai/fbDownloader')
module.exports = async function (url) {
  return fbDownloader(url);
};