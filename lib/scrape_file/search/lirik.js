// ai/lyrics.js
// Scrape Genius.com lyrics with DuckDuckGo (bypass CF)
// Asal kode: AlfiDev (sedikit dirapikan untuk modul scrape)

const axios = require("axios");
const cheerio = require("cheerio");

const findGenius = async (q, h) => {
  const url = encodeURIComponent(`${q} site:genius.com`);
  const r = await axios.get(`https://duckduckgo.com/html/?q=${url}`, {
    headers: h,
  });
  const $ = cheerio.load(r.data);
  let out = null;
  $("a").each((i, e) => {
    if (out) return;
    const href = $(e).attr("href") || "";
    if (href.includes("genius.com")) {
      out = href;
    } else if (href.startsWith("/l/?") && href.includes("uddg=")) {
      const m = href.match(/uddg=([^&]+)/);
      if (m?.[1]) {
        const d = decodeURIComponent(m[1]);
        if (d.includes("genius.com")) out = d;
      }
    }
  });
  return out;
};

const extractLyrics = (html) => {
  if (!html || typeof html !== "string") return null;

  const $ = cheerio.load(html);
  $("script,style,noscript").remove();

  const clean = (f) => {
    if (!f) return "";
    let s = String(f)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(
        /<\/(div|p|li|section|article|header|footer)[^>]*>/gi,
        "\n"
      )
      .replace(/<img[^>]*>/gi, "")
      .replace(/<\/?[^>]+>/g, "");
    s = cheerio.load(`<div>${s}</div>`)("div").text();
    return s
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  };

  const sel = [
    '[data-lyrics-container="true"]',
    'div[class*="Lyrics__Container"]',
    "div.lyrics",
    ".song_body-lyrics",
    ".lyrics__root",
  ];

  for (const s of sel) {
    const el = $(s);
    if (!el.length) continue;

    const parts = [];
    el.each((i, e) => {
      const txt = clean($(e).html() || "");
      if (txt) parts.push(txt);
    });

    if (!parts.length) continue;

    let text = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

    const junk = [
      /Read\s*More/gi,
      /Translations?/gi,
      /(?:فارسی|Español)/gi,
      /\b[\w\s]*Lyrics\b/gi,
      /https?:\/\/images\.genius\.com\/\S+/gi,
      /SizedImage__NoScript[-\w]*/gi,
      /The lyrics are about[\s\S]*/gi,
    ];
    for (const p of junk) text = text.replace(p, " ");

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => {
        const low = l.toLowerCase();
        if (!l || l.length < 2) return false;
        if (/^share|^songfacts|^embed/.test(low)) return false;
        if (/^(farsi|فارسی|español|translation)/i.test(l)) return false;
        if (/^https?:\/\//.test(l)) return false;
        if (/^(album|artist|writer|producer):/i.test(l)) return false;
        if (l.split(" ").length === 1 && l.length < 10) return false;
        return true;
      });

    const uniq = [];
    let last = null;
    for (const x of lines) {
      if (x === last) continue;
      last = x;
      uniq.push(x);
    }

    const ok = uniq.join("\n").trim();
    if (ok && ok.length > 50 && ok.split("\n").length >= 2) return ok;
  }

  const ld = $('script[type="application/ld+json"]')
    .map((i, e) => $(e).html())
    .get();
  for (const c of ld) {
    try {
      const obj = JSON.parse(c);
      const ly =
        typeof obj.lyrics === "string"
          ? obj.lyrics
          : obj.lyrics?.text;
      if (ly) {
        const t = ly.replace(/\s+/g, " ").trim();
        if (t.length > 50) return t;
      }
    } catch {}
  }

  const pre = html.match(
    /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/
  );
  if (pre) {
    try {
      const o = JSON.parse(pre[1]);
      const str = JSON.stringify(o);
      const m = str.match(
        /"lyrics"\s*:\s*"([^"]{50,})"/
      );
      if (m) {
        const t = m[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"');
        if (t.length > 50) return t;
      }
    } catch {}
  }

  const m =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content");
  if (m) {
    const t = m.replace(/\s+/g, " ").trim();
    if (
      t.length > 30 &&
      !/translation|read more|lyrics/i.test(t)
    )
      return t;
  }

  return null;
};

const ddgExtract = async (q, h) => {
  const qq = encodeURIComponent(`${q} site:genius.com`);
  const r = await axios.get(
    `https://duckduckgo.com/html/?q=${qq}`,
    { headers: h }
  );
  const $ = cheerio.load(r.data);
  let url = null,
    snip = null;
  $("a").each((i, e) => {
    if (url) return;
    const href = $(e).attr("href") || "";
    const grab = () => {
      const p = $(e).closest(
        ".result,.result__body,.result__snippet,.c-result"
      );
      snip =
        p
          .find(
            ".result__snippet,.result__excerpt,.c-abstract,.snippet"
          )
          .first()
          .text()
          .trim() || null;
      if (!snip)
        snip = $(e)
          .parent()
          .text()
          .replace($(e).text(), "")
          .trim() || null;
    };
    if (href.includes("genius.com")) {
      url = href;
      grab();
    } else if (
      href.startsWith("/l/?") &&
      href.includes("uddg=")
    ) {
      const m = href.match(/uddg=([^&]+)/);
      if (m?.[1]) {
        const d = decodeURIComponent(m[1]);
        if (d.includes("genius.com")) {
          url = d;
          grab();
        }
      }
    }
  });
  return { pageUrl: url, snippet: snip };
};

const searchLyrics = async (q = "") => {
  if (!q) throw new Error("Query is required.");

  const api = `https://genius.com/api/search/multi?q=${encodeURIComponent(
    q
  )}`;
  const hd = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    Accept: "application/json,text/plain,*/*",
  };

  try {
    const r = await axios.get(api, { headers: hd });
    const j =
      typeof r.data === "string"
        ? JSON.parse(r.data)
        : r.data;
    const sec = j?.response?.sections?.find(
      (s) => s.type === "song"
    );
    if (!sec?.hits?.length) throw new Error("Not found");

    const song = sec.hits[0].result;
    const url = song.url;
    const page = await axios.get(url, {
      headers: { "User-Agent": hd["User-Agent"] },
    });
    const ly = extractLyrics(page.data);

    return {
      title: song.full_title,
      thumbnail: song.song_art_image_url,
      url,
      lyrics: ly || null,
    };
  } catch (e) {
    if (e?.response?.status === 403) {
      const ddg = await findGenius(q, hd);
      const { pageUrl, snippet } = await ddgExtract(q, hd);
      const link = pageUrl || ddg;
      if (!link && !snippet) {
        throw new Error("Fallback gagal");
      }
      const text = snippet?.trim() || null;
      return {
        title: q,
        thumbnail: null,
        url: link || null,
        lyrics: text || `Preview mati, buka ${link}`,
      };
    }
    // Biar error message-nya bersih
    throw new Error(e?.message || "Gagal mengambil lirik");
  }
};

// ⬇⬇⬇ INI YANG DIPANGGIL OLEH scrape('ai/lyrics') ⬇⬇⬇
module.exports = async function (query = "") {
  const data = await searchLyrics(query);
  return data; // { title, thumbnail, url, lyrics }
};