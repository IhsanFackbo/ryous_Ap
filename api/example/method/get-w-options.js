let handler = async (res, req) => {
    try {
        const { query, type, limit } = req.query;
        
        const results = Array.from({ length: parseInt(limit) || 5 }, (_, i) => ({
            id: i + 1,
            title: `${type} Result ${i + 1} for "${query}"`,
            type,
            score: Math.random()
        }));
        
        res.reply({
            query,
            type,
            total: results.length,
            results
        });
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'GET With Options Example';
handler.category = 'Example';
handler.params = {
    query: { desc: 'Search query string.', example: 'javascript' },
    type: { desc: 'Type of search result.', example: 'article', options: ['article', 'video', 'image', 'all'] },
    limit: { desc: 'Number of results to return.', example: '10', required: false, type: 'number' }
};

module.exports = handler;