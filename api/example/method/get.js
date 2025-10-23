let handler = async (res, req) => {
    try {
        const { name } = req.query;
        
        res.reply(`Hello, ${name || 'Guest'}!`);
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'GET Example';
handler.category = 'Example';
handler.params = {
    name: { desc: 'Your name.', example: 'John', required: false }
};

module.exports = handler;