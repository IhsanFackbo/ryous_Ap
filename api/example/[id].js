let handler = async (res, req) => {
    try {
        const { id } = req.params;
        
        res.reply({
            message: 'User found',
            data: {
                id,
                username: `user_${id}`,
                email: `user${id}@example.com`,
                createdAt: '2024-01-01T00:00:00Z'
            }
        });
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'Dynamic Route Example';
handler.category = 'Example';
handler.routeParams = {
    id: { desc: 'User ID to retrieve.', example: '12345', type: 'string' }
};

module.exports = handler;