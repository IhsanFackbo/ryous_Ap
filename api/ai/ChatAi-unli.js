// api/unlimitedai.js

const src = scrape("ai/Ai-chat-unlimited");

let handler = async (res, req) => {
  try {
    const q = req.query || {};
    const question = q.q || q.text || q.msg || q.prompt;

    if (!question) {
      return res.reply({
        success: false,
        message:
          'Query "q" wajib diisi. Contoh: /api/unlimitedai?q=hi! apa kabar?'
      });
    }

    const data = await src(question);

    if (!data || data.success === false) {
      return res.reply({
        success: false,
        message: data?.message || "Gagal mengambil jawaban dari UnlimitedAI"
      });
    }

    return res.reply({
      success: true,
      owner: "@IsanAndres",
      result: {
        question,
        answer: data.answer
      },
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    return res.reply(
      {
        success: false,
        message: e?.message || String(e)
      },
      { code: 500 }
    );
  }
};

handler.alias = "UnlimitedAI Chat";
handler.category = "AI";
handler.params = {
  q: {
    desc: "Pertanyaan untuk UnlimitedAI",
    example: "Halo, apa kabar?"
  }
};

module.exports = handler;