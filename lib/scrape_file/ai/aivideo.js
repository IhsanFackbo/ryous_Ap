const axios = require("axios");
const crypto = require("crypto");

module.exports = async function veo3({ prompt, image }) {
  try {
    if (!prompt) {
      return {
        success: false,
        message: "Prompt is required"
      };
    }

    // 1. Token verify (turnstile)
    const { data: cf } = await axios.post(
      "https://cf.nekolabs.my.id/action",
      {
        mode: "turnstile-min",
        siteKey: "0x4AAAAAAANuFg_hYO9YJZqo",
        url: "https://aivideogenerator.me/features/g-ai-video-generator"
      }
    );

    if (!cf || !cf.token) {
      return { success: false, message: "Failed to fetch verify token" };
    }

    // 2. Unique id + random secondary page id
    const uid = crypto
      .createHash("md5")
      .update(Date.now().toString())
      .digest("hex");

    const secId = Math.floor(Math.random() * 100) + 1700;

    // 3. Create task
    const { data: task } = await axios.post(
      "https://aiarticle.erweima.ai/api/v1/secondary-page/api/create",
      {
        prompt,
        imgUrls: image ? [image] : [],
        quality: "720p",
        duration: 8,
        autoSoundFlag: false,
        soundPrompt: "",
        autoSpeechFlag: false,
        speechPrompt: "",
        speakerId: "Auto",
        aspectRatio: "16:9",
        secondaryPageId: secId,
        channel: "VEO3",
        source: "aivideogenerator.me",
        type: "features",
        watermarkFlag: true,
        privateFlag: true,
        isTemp: true,
        vipFlag: true,
        model: "veo-3-fast"
      },
      {
        headers: {
          uniqueid: uid,
          verify: cf.token
        }
      }
    );

    if (!task?.data?.recordId) {
      return { success: false, message: "Failed to create generation task" };
    }

    const recordId = task.data.recordId;

    // 4. Polling status
    while (true) {
      const { data } = await axios.get(
        `https://aiarticle.erweima.ai/api/v1/secondary-page/api/${recordId}`,
        {
          headers: {
            uniqueid: uid,
            verify: cf.token
          }
        }
      );

      const st = data?.data?.state;
      const complete = data?.data?.completeData;

      if (st === "fail") {
        return { success: false, result: JSON.parse(complete) };
      }

      if (st === "success") {
        return { success: true, result: JSON.parse(complete) };
      }

      await new Promise((r) => setTimeout(r, 1500));
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
};