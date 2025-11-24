const axios = require('axios');

// Ambil cover art via iTunes API
async function fetchCover(query) {
  try {
    const { data } = await axios.get("https://itunes.apple.com/search", {
      params: { term: query, entity: "song", limit: 1 },
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!data.results || data.results.length === 0) return null;

    const art = data.results[0].artworkUrl100;
    return art ? art.replace("100x100bb", "600x600bb") : null;
  } catch {
    return null;
  }
}

async function lyrics(title) {
  try {
    if (!title) {
      return {
        success: false,
        message: "Title is required"
      };
    }

    // Search lyrics from LRCLib
    const { data } = await axios.get("https://lrclib.net/api/search", {
      params: { q: title },
      headers: {
        referer: `https://lrclib.net/search/${encodeURIComponent(title)}`,
        'user-agent': 'Mozilla/5.0'
      }
    });

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        message: "Lyrics not found"
      };
    }

    const track = data[0]; // Only best match

    // Ambil cover image
    const query = `${track.trackName || title} ${track.artistName || ''}`;
    const image = await fetchCover(query);

    // Rapikan lirik, hapus "\n" jadi baris asli
    const lyricsClean = (track.plainLyrics || "")
      .replace(/\\n/g, "\n")
      .replace(/\r/g, "")
      .trim();

    return {
      success: true,
      title: track.trackName || "",
      artist: track.artistName || "",
      album: track.albumName || "",
      image,
      lyrics: lyricsClean
    };

  } catch (err) {
    return {
      success: false,
      message: err.message || "Unknown error"
    };
  }
}

module.exports = lyrics;