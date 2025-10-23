let handler = async (res, req) => {
    try {
        const { category, slug } = req.params;
        
        res.reply({
            message: 'Article found',
            data: {
                category,
                slug,
                title: `Article about ${slug}`,
                content: `This is an article in ${category} category about ${slug}.`,
                publishedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.reply(error.message, { code: 500 });
    }
};

handler.alias = 'Multiple Dynamic Routes Example';
handler.category = 'Example';
handler.routeParams = {
    category: { desc: 'Article category.', example: 'technology', options: ['technology', 'health', 'business', 'sports'] },
    slug: { desc: 'Article slug (URL-friendly identifier).', example: 'nodejs-tutorial' }
};

module.exports = handler;