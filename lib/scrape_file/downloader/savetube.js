
/* 
   nama  : yt downloader
   base  : https://www-y2mate.com/ (cnv.cx)
   by    : wolep (mod by ChatGPT)
   note  : bisa download audio/video dan pilihan quality
           versi ini untuk SCRAPE API:
           - TIDAK auto fs.writeFile
           - TIDAK auto jalan sendiri
           - export: function(url, format) → { success, fileName, mime, downloadUrl }
*/

const yt = {
    static: Object.freeze({
        baseUrl: 'https://cnv.cx',
        headers: {
            'accept-encoding': 'gzip, deflate, br, zstd',
            'origin': 'https://frame.y2meta-uk.com',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
        }
    }),

    log: function (message) {
        // kalau mau silent log, tinggal uncomment `return`
        // return
        const name = 'yt-skrep'
        console.log(`[${name}] ${message}`)
    },

    resolveConverterPayload: function (link, userFormat = '128k') {
        const availableFormats = ['128k', '320k', '144p', '240p', '360p', '720p', '1080p']
        if (!availableFormats.includes(userFormat)) {
            throw Error(`invalid format. available format: ${availableFormats.join(', ')}`)
        }

        const format = userFormat.endsWith('k') ? 'mp3' : 'mp4'
        const audioBitrate = format === 'mp3' ? String(parseInt(userFormat)) : '128'
        const videoQuality = format === 'mp4' ? String(parseInt(userFormat)) : '720'
        const filenameStyle = 'pretty'
        const vCodec = 'h264'

        return { link, format, audioBitrate, videoQuality, filenameStyle, vCodec }
    },

    sanitizeFileName: function (fileName) {
        const extMatch = fileName.match(/\.[^.]+$/)
        const ext = extMatch ? extMatch[0] : '.mp4'
        const withoutExt = fileName.replace(new RegExp(`\\${ext}$`), '')

        const fn = withoutExt
            .replaceAll(/[^A-Za-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase()

        return (fn || 'video') + ext
    },

    getBuffer: async function (urlDownload) {
        this.log('downloading file...')
        const headers = structuredClone(this.static.headers)
        headers.referer = 'https://v6.www-y2mate.com/'
        delete headers.origin

        const r = await fetch(urlDownload, { headers })
        if (!r.ok) throw Error(`${r.status} ${r.statusText} di fungsi getBuffer`)

        const ab = await r.arrayBuffer()
        const buff = Buffer.from(ab)
        this.log('sukses download file')
        return buff
    },

    getKey: async function () {
        this.log('coba ambil key')
        const endpoint = '/v2/sanity/key'
        const r = await fetch(this.static.baseUrl + endpoint, {
            headers: this.static.headers,
        })
        if (!r.ok) throw Error(`${r.status} ${r.statusText} di fungsi getKey`)
        const j = await r.json()
        return j
    },

    convert: async function (yt_url, userFormat = '128k') {
        const { key } = await this.getKey()

        this.log('coba ambil url')
        const payload = this.resolveConverterPayload(yt_url, userFormat)
        const headers = {
            key,
            ...this.static.headers
        }

        const endpoint = '/v2/converter'
        const r = await fetch(this.static.baseUrl + endpoint, {
            headers,
            method: 'post',
            body: new URLSearchParams(payload)
        })
        if (!r.ok) throw Error(`${r.status} ${r.statusText} di fungsi convert`)
        const j = await r.json()
        this.log('dapat url ' + j.url)
        return j
    },

    download: async function (yt_url, userFormat = '128k') {
        const { url, filename } = await this.convert(yt_url, userFormat)
        const fileName = this.sanitizeFileName(filename)
        const buffer = await this.getBuffer(url)
        return { fileName, buffer, format: userFormat }
    }
}

/**
 * EXPORT UNTUK SCRAPE:
 * dipanggil dari handler: const src = require('.../youtube'); await src(url, format)
 * default: return URL langsung (bukan buffer, biar nggak lemot).
 */
module.exports = async function scrapeYoutube(link, format = '128k') {
    const { url, filename } = await yt.convert(link, format)
    const fileName = yt.sanitizeFileName(filename || 'video.mp4')
    const isAudio = format.endsWith('k')
    const mime = isAudio ? 'audio/mpeg' : 'video/mp4'

    return {
        success: true,
        fileName,
        format,
        mime,
        downloadUrl: url
        // kalau mau buffer:
        // const { buffer } = await yt.download(link, format)
        // return { success: true, fileName, format, mime, buffer }
    }
}

// kalau suatu saat mau akses fungsi mentahnya:
// module.exports.raw = yt