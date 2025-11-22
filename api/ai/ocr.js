const src = scrape('ai/ocr');

let handler = async (res, req) => {
    try {
        const { imageUrl } = req.query;

        if (!imageUrl) {
            return res.reply({ success: false, error: "imageUrl wajib" }, { code: 400 });
        }

        // Ambil buffer dari gambar
        const buffer = await res.getBuffer(imageUrl, { mime: 'image' });

        // Proses OCR
        const result = await src(buffer);

        // Kirim JSON response
        res.reply(result);

    } catch (error) {
        res.reply({ success: false, error: error.message }, { code: 500 });
    }
};

handler.alias = 'OCR';
handler.category = 'AI';
handler.params = {
    imageUrl: { desc: 'Direct image URL', example: 'https://tmpfiles.org/...' }
};

module.exports = handler;