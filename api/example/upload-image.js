let handler = async (res, req) => {
    try {
        const { title } = req.body;
        const file = req.file;
        
        if (!file) return res.reply('No file uploaded', { code: 400 });
        
        res.reply({
            success: true,
            data: {
                title: title || 'Untitled',
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                uploadedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'Upload Image Example';
handler.category = 'Example';
handler.method = 'POST';
handler.acceptFiles = true;
handler.params = {
    title: { desc: 'Title for the uploaded image.', example: 'My Photo', required: false }
};

module.exports = handler;