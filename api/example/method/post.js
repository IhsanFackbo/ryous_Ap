let handler = async (res, req) => {
    try {
        const { title, content, tags } = req.body;
        
        res.reply({
            id: Math.random().toString(36).substr(2, 9),
            title,
            content,
            tags: tags || [],
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'POST Example';
handler.category = 'Example';
handler.method = 'POST';
handler.body = {
    title: '19 Juta Lapangan Pekerjaan',
    content: 'Fufufafa',
    tags: ['Politik', 'Kritik']
};

module.exports = handler;