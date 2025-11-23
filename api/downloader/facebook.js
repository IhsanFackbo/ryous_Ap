// api/fbdl.js
const src = scrape("downloader/fbdl");

let handler = async (res, req) => {
  try {
    const { url } = req.query || {};

    if (!url) {
      return res.reply(
        { success: false, message: `Param "url" wajib diisi.` },
        { code: 400 }
      );
    }

    const data = await src(url);

    return res.reply(data, { code: 200 });
  } catch (e) {
    return res.reply(
      {
        success: false,
        message: e?.message || String(e),
      },
      { code: 500 }
    );
  }
};

handler.alias = "Facebook Downloader";
handler.category = "Downloader";
handler.params = {
  url: {
    desc: "Link video Facebook / Reels",
    example: "https://www.facebook.com/share/v/1aF74GAacy/",
  },
};

module.exports = handler;