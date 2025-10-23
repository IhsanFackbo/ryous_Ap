let handler = async (res, req) => {
    try {
        res.reply({
            message: 'This endpoint is working!'
        });
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'Maintenance Mode Example';
handler.category = 'Example';
handler.status = 'maintenance'; // maintenance, error

module.exports = handler;