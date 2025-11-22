// api/fastflux-generate.js
const { generateImage } = scrape('ai/fastflux');

let handler = async (res, req) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.reply(
        { success: false, error: 'Parameter text wajib diisi.' },
        { code: 400 }
      );
    }

    const data = await generateImage(text);

    return res.reply(
      {
        success: true,
        ...data
      }
    );
  } catch (error) {
    console.error('FastFlux Generate Error:', error);

    const msg =
      typeof error === 'string'
        ? error
        : error?.message || JSON.stringify(error);

    return res.reply(
      {
        success: false,
        error: msg
      },
      { code: 500 }
    );
  }
};

handler.alias = 'FastFlux Image Generator';
handler.category = 'AI';
handler.params = {
  text: {
    desc: 'Prompt teks untuk generate image',
    example: 'kucing imut pakai hoodie, 4k'
  }
};

module.exports = handler;