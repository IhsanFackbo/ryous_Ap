// api/fastflux-generate.js
const src = scrape('ai/fastflux'); // sesuaikan path sesuai sistem scrape kamu

let handler = async (res, req) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.reply(
        { success: false, error: 'Parameter text wajib diisi.' },
        { code: 400 }
      );
    }

    const data = await src.generate(text);

    return res.reply({
      success: true,
      ...data
    });
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
    example: 'cute cat astronaut in space, 4k'
  }
};

module.exports = handler;