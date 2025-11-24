const axios = require('axios');

async function lyrics(title) {
    try {
        if (!title) {
            return {
                success: false,
                message: "Title is required"
            };
        }

        const { data } = await axios.get(
            `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`,
            {
                headers: {
                    referer: `https://lrclib.net/search/${encodeURIComponent(title)}`,
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                },
                timeout: 15000
            }
        );

        if (!data || data.length === 0) {
            return {
                success: false,
                message: "No results found"
            };
        }

        return {
            success: true,
            results: data
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Unknown error"
        };
    }
}

module.exports = lyrics;