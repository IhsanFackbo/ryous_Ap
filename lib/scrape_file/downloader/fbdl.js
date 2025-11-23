// ai/fbDownloader.js
// Facebook video downloader (HD/SD extractor)
// Returns: { success, hd, sd, message }

const axios = require("axios");

async function fbDownloader(url) {
  if (!url || !url.includes("facebook.com")) {
    return {
      success: false,
      message: "URL Facebook tidak valid."
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

    const hd =
      html.match(/"browser_native_hd_url":"(.*?)"/)?.[1]?.replace(/\\\//g, "/") ||
      null;

    const sd =
      html.match(/"browser_native_sd_url":"(.*?)"/)?.[1]?.replace(/\\\//g, "/") ||
      null;

    if (!hd && !sd) {
      return {
        success: false,
        message: "Video tidak ditemukan atau FB memblokir scraping."
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

// export untuk scrape('ai/fbDownloader')
module.exports = async function (url) {
  return fbDownloader(url);
};