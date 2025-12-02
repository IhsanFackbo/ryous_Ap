const axios = require('axios');
const FormData = require('form-data');
const ProxyAgent = require('@rynn-k/proxy-agent');

const proxy = new ProxyAgent('./proxies.txt', { random: true }); // sesuaikan path proxies.txt kalau beda
const agentCfg = proxy.config();

const API_URL  = 'https://thestinger-ilaria-upscaler.hf.space/gradio_api';
const FILE_URL = 'https://thestinger-ilaria-upscaler.hf.space/gradio_api/file=';

function generateSession() {
  return Math.random().toString(36).substring(2);
}

async function upload(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Image buffer is required');
  }

  const upload_id = generateSession();
  const orig_name = `ilaria_${Date.now()}.jpg`;

  const form = new FormData();
  form.append('files', buffer, orig_name);

  const { data } = await axios.post(
    `${API_URL}/upload?upload_id=${upload_id}`,
    form,
    {
      ...agentCfg,
      headers: form.getHeaders()
    }
  );

  if (!data || !data[0]) {
    throw new Error('Failed to upload image to Ilaria');
  }

  return {
    orig_name,
    path: data[0],
    url: `${FILE_URL}${data[0]}`
  };
}

/**
 * Scraper Ilaria Upscaler
 * @param {Buffer} buffer - buffer gambar input
 * @param {Object} options
 * @param {string} options.model - model RealESRGAN
 * @param {number} options.resolution - scale (1–6)
 * @param {boolean} options.face - face enhancement (true/false)
 * @param {number} options.denoise - strength 0–1 (opsional)
 * @returns {Promise<Buffer>} - buffer gambar hasil upscale
 */
module.exports = async function ilariaUpscale(buffer, options = {}) {
  try {
    const {
      model = 'RealESRGAN_x4plus',
      resolution = 4,
      face = false,
      denoise = 0.5
    } = options;

    const MODEL_LIST = [
      'RealESRGAN_x4plus',
      'RealESRNet_x4plus',
      'RealESRGAN_x4plus_anime_6B',
      'RealESRGAN_x2plus',
      'realesr-general-x4v3'
    ];

    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Image buffer is required');
    }
    if (!MODEL_LIST.includes(model)) {
      throw new Error(`Available models: ${MODEL_LIST.join(', ')}`);
    }
    if (denoise < 0 || denoise > 1) {
      throw new Error('Denoise strength must be between 0 and 1');
    }
    if (resolution < 1 || resolution > 6) {
      throw new Error('Resolution must be between 1 and 6');
    }
    if (typeof face !== 'boolean') {
      throw new Error('Face enhancement (face) must be boolean');
    }

    // 1) Upload gambar
    const image = await upload(buffer);
    const session_hash = generateSession();

    // 2) Kirim job ke queue
    await axios.post(
      `${API_URL}/queue/join?`,
      {
        data: [
          {
            path: image.path,
            url: image.url,
            orig_name: image.orig_name,
            size: buffer.length,
            mime_type: 'image/jpeg',
            meta: { _type: 'gradio.FileData' }
          },
          model,
          denoise,          // di API aslinya: denoice_strength
          face,             // di API aslinya: fase_enhancement
          resolution
        ],
        event_data: null,
        fn_index: 1,
        trigger_id: 20,
        session_hash
      },
      {
        ...agentCfg,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // 3) Ambil hasil dari queue
    const { data } = await axios.get(
      `${API_URL}/queue/data?session_hash=${session_hash}`,
      {
        ...agentCfg,
        responseType: 'text',
        timeout: 60000
      }
    );

    let resultUrl = null;
    const lines = String(data).split('\n\n');
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;

      try {
        const payload = JSON.parse(line.substring(5).trim()); // substring(6) di kode lama, di sini 5 krn 'data:' = 5 char
        if (payload.msg === 'process_completed') {
          // output.data[0].url → URL hasil gambar
          if (
            payload.output &&
            Array.isArray(payload.output.data) &&
            payload.output.data[0] &&
            payload.output.data[0].url
          ) {
            resultUrl = payload.output.data[0].url;
            break;
          }
        }
      } catch (_) {
        // skip line yang bukan JSON valid
      }
    }

    if (!resultUrl) {
      throw new Error('Failed to get result URL from Ilaria queue');
    }

    // 4) Download gambar hasil sebagai buffer
    const outRes = await axios.get(resultUrl, {
      ...agentCfg,
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    return Buffer.from(outRes.data);
  } catch (err) {
    // biar error gampang dibaca di API layer
    throw new Error(`IlariaUpscaler error: ${err.message || String(err)}`);
  }
};