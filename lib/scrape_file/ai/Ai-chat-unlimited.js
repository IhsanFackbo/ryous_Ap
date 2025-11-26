// lib/scrape_file/ai/Ai-chat-unlimited.js

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

module.exports = async function unlimitedAI(question) {
  try {
    if (!question) {
      return {
        success: false,
        message: "Question is required."
      };
    }

    const inst = axios.create({
      baseURL: "https://app.unlimitedai.chat/api",
      headers: {
        referer: "https://app.unlimitedai.chat/id",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36"
      }
    });

    // ambil token dulu
    const { data: tokenData } = await inst.get("/token");

    // kirim chat
    const { data: raw } = await inst.post(
      "/chat",
      {
        messages: [
          {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            role: "user",
            content: question,
            parts: [{ type: "text", text: question }]
          }
        ],
        id: uuidv4(),
        selectedChatModel: "chat-model-reasoning",
        selectedCharacter: null,
        selectedStory: null
      },
      {
        headers: {
          "x-api-token": tokenData.token
        }
      }
    );

    // response mereka biasanya newline-stream, cari baris yang mulai "0:"
    const lines = String(raw).split("\n");
    const found = lines.find((l) => l.trim().startsWith("0:"));

    if (!found) {
      return {
        success: false,
        message: "No result returned from UnlimitedAI"
      };
    }

    let answer = found.trim().slice(2).trim();  // buang "0:"
    answer = answer.replace(/^:+/, "").trim();
    answer = answer.replace(/^"+|"+$/g, "");

    return {
      success: true,
      answer
    };
  } catch (e) {
    return {
      success: false,
      message: e.message || String(e)
    };
  }
};