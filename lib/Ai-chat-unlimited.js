// Lib/Scrape_file/ai/unlimitedai.js

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function unlimitedai(question) {
  try {
    if (!question) throw new Error('Question is required.');

    const inst = axios.create({
      baseURL: 'https://app.unlimitedai.chat/api',
      headers: {
        referer: 'https://app.unlimitedai.chat/id',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
      },
    });

    // ambil token dulu
    const { data: a } = await inst.get('/token');

    // kirim chat
    const { data } = await inst.post(
      '/chat',
      {
        messages: [
          {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            role: 'user',
            content: question,
            parts: [
              {
                type: 'text',
                text: question,
              },
            ],
          },
        ],
        id: uuidv4(),
        selectedChatModel: 'chat-model-reasoning',
        selectedCharacter: null,
        selectedStory: null,
      },
      {
        headers: {
          'x-api-token': a.token,
        },
      }
    );

    // data biasanya stream-like (newline per event)
    const text = String(data);
    const line = text
      .split('\n')
      .find((l) => l.trim().startsWith('0:'));

    if (!line) throw new Error('No result found.');

    // contoh format: 0:"jawaban di sini"
    // ambil setelah "0:" dan bersihkan tanda kutip di awal/akhir
    let result = line.trim().slice(2).trim(); // buang "0:"
    if (result.startsWith(':')) result = result.slice(1).trim(); // jaga-jaga
    result = result.replace(/^"+|"+$/g, ''); // hapus quote pembuka/penutup

    return {
      success: true,
      answer: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || String(error),
    };
  }
}

module.exports = unlimitedai;