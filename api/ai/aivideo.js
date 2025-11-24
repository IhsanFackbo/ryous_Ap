const src = scrape("ai/aivideo");

let handler = async (res, req) => {
  try {
    const q = req.query || {};
    const prompt = q.prompt;
    const image = q.image || null;

    if (!prompt) {
      return res.reply({
        success: false,
        message: 'Parameter "prompt" wajib diisi'
      });
    }

    const result = await src({ prompt, image });

    return res.reply({
      success: true,
      owner: "@IsanAndres",
      result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.reply(
      {
        success: false,
        message: e.message || String(e)
      },
      { code: 500 }
    );
  }
};

handler.alias = "VEO 3 AI Video Generator";
handler.category = "AI";
handler.params = {
  prompt: {
    desc: "Prompt deskripsi video",
    example:
      "Make it look like the character is being blown by wind in front"
  },
  image: {
    desc: "Image URL (optional)",
    example: "https://tmpfiles.org/xxxxx.png"
  }
};

module.exports = handler;