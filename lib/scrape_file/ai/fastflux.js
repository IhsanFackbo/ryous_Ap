// ai/fastflux.js
const axios = require('axios');

class FastFlux {
  constructor() {
    this.base = 'https://fast-flux-demo.replicate.workers.dev';
    this.client = axios.create({
      baseURL: this.base,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.7499.34 Mobile Safari/537.36',
        'accept': 'application/json, text/plain, */*'
      }
    });
  }

  /**
   * Generate image dari text prompt
   * @param {string} text
   * @returns {Promise<any>} hasil mentah dari API + normalisasi basic
   */
  async generate(text) {
    try {
      if (!text) throw new Error('text is required.');

      const { data } = await this.client.get('/api/generate-image', {
        params: { text }
      });

      // Normalisasi dikit, tapi tetap kirim raw juga
      if (typeof data === 'string') {
        // kalau API cuma balikin URL string
        return {
          prompt: text,
          imageUrl: data,
          raw: data
        };
      }

      // kalau sudah JSON (misal { image_url: '...' } dst.)
      return {
        prompt: text,
        imageUrl: data.image_url || data.url || null,
        raw: data
      };
    } catch (error) {
      if (error.response) {
        throw new Error(
          `FastFlux ${error.response.status}: ${
            typeof error.response.data === 'string'
              ? error.response.data
              : JSON.stringify(error.response.data)
          }`
        );
      }
      throw new Error(error.message || String(error));
    }
  }
}

module.exports = new FastFlux();