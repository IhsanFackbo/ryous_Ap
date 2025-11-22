// ai/ocr.js
const axios = require('axios');
const { fileTypeFromBuffer } = require('file-type');
const uploadImage = require('../../lib/uploadImage'); // sesuaikan path

class OCR {
    ocr = async function (buffer) {
        try {
            if (!buffer) throw new Error('Buffer is required.');

            // Deteksi jenis file
            const type = await fileTypeFromBuffer(buffer);
            if (!type || !/^image\//.test(type.mime)) {
                throw new Error('File bukan gambar atau tipe tidak dikenali.');
            }

            // Upload gambar (ke tmpfiles / telegra / dll, sesuai implementasi uploadImage)
            const imageUrl = await uploadImage(buffer);
            if (!imageUrl) throw new Error('Gagal upload gambar.');

            // Panggil API OCR
            const apiUrl = `https://anabot.my.id/api/tools/ocr?imageUrl=${encodeURIComponent(imageUrl)}&apikey=freeApikey`;

            const { data } = await axios.get(apiUrl, {
                headers: { accept: '*/*' }
            });

            if (!data || data.success !== true) {
                throw new Error('OCR gagal: ' + JSON.stringify(data || {}));
            }

            const extractedText = (data.data && data.data.result) ? data.data.result : '';

            return {
                success: true,
                imageUrl,
                extractedText
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
}

module.exports = new OCR();