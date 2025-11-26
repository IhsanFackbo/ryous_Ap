const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = async function unlimitedai(question) {
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

    const { data: a } = await inst.get("/token");

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
          "x-api-token": a.token
        }
      }
    );

    const lines = String(raw).split("\n");
    const found = lines.find((l) => l.trim().startsWith("0:"));

    if (!found) {
      return {
        success: false,
        message: "No result returned from UnlimitedAI"
      };
    }

    let result = found.trim().slice(2).trim();
    result = result.replace(/^:+/, "").trim();
    result = result.replace(/^"+|"+$/g, "");

    return {
      success: true,
      answer: result
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || String(error)
    };
  }
};