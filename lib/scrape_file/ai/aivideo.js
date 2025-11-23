const axios = require("axios");
const FormData = require("form-data");

async function uploadImage(imageBuffer) {
  const form = new FormData();
  form.append("file", imageBuffer, "image.png");

  const res = await axios.post("https://aivideogenerator.me/api/upload", form, {
    headers: form.getHeaders()
  });

  return res.data.url; // URL CDN hasil upload
}

async function createJob(imageUrl, prompt) {
  const payload = {
    image: imageUrl,
    prompt,
    model: "g-video",  // model default halaman itu
    duration: 4
  };

  const res = await axios.post("https://aivideogenerator.me/api/generate", payload, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  return res.data.job_id;
}

async function checkJob(job_id) {
  const res = await axios.get(`https://aivideogenerator.me/api/job/${job_id}`);
  return res.data;
}

module.exports = async function generateVideo(imageBuffer, prompt) {
  try {
    // Upload file ke server AI
    const imageUrl = await uploadImage(imageBuffer);

    // Buat job
    const job_id = await createJob(imageUrl, prompt);

    // Polling (cek status setiap 3 detik)
    let result;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const status = await checkJob(job_id);

      if (status.status === "completed") {
        result = status;
        break;
      }
    }

    return {
      success: true,
      job_id,
      image: imageUrl,
      result: result || "timeout"
    };

  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
};