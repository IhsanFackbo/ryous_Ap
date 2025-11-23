const aiVideo = scrape("ai/aivideo");

let handler = async (res, req) => {
  try {
    const { prompt, imageUrl } = req.query;

    if (!prompt)
      return res.reply({ success: false, error: "Prompt wajib diisi!" });

    let imageBuffer;

    // Jika user kirim URL gambar
    if (imageUrl) {
      const axios = require("axios");
      const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(imgRes.data);
    } 
    
    // Jika kirim file (binary upload)
    else if (req.file) {
      imageBuffer = req.file.buffer;
    } 
    
    else {
      return res.reply({
        success: false,
        error: "Harus kirim imageUrl atau upload file!"
      });
    }

    const result = await aiVideo(imageBuffer, prompt);
    res.reply(result);

  } catch (e) {
    res.reply({ success: false, message: e.message }, { code: 500 });
  }
};

handler.alias = "AI Image-to-Video";
handler.category = "AI";
handler.params = {
  prompt: { desc: "Deskripsi video", example: "flying dragon in neon city" },
  imageUrl: { desc: "URL gambar optional" }
};

module.exports = handler;