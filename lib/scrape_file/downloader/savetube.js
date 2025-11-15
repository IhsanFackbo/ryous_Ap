/* 
   YouTube Direct Downloader - cnv.cx
   v1 - by ChatGPT fix untuk sistem handler + scrape
*/

const yt = {
  static: {
    baseUrl: 'https://cnv.cx',
    headers: {
      'accept-encoding': 'gzip, deflate, br, zstd',
      'origin': 'https://frame.y2meta-uk.com',
      'user-agent': 'Mozilla/5.0'
    }
  },

  async getKey() {
    const r = await fetch(`${this.static.baseUrl}/v2/sanity/key`, {
      headers: this.static.headers
    });

    if (!r.ok) throw new Error('Gagal ambil key');

    return await r.json();
  },

  async convert(url, format) {
    const { key } = await this.getKey();

    const payload = this.resolvePayload(url, format);

    const r = await fetch(`${this.static.baseUrl}/v2/converter`, {
      method: 'POST',
      headers: {
        ...this.static.headers,
        key
      },
      body: new URLSearchParams(payload)
    });

    if (!r.ok) throw new Error('Gagal convert URL');

    return await r.json();
  },

  resolvePayload(url, format) {
    const allowed = ['128k','320k','144p','240p','360p','720p','1080p'];

    if (!allowed.includes(format))
      throw new Error(`Invalid format. Use one of: ${allowed.join(', ')}`);

    const isAudio = format.endsWith('k');

    return {
      link: url,
      format: isAudio ? 'mp3' : 'mp4',
      audioBitrate: isAudio ? format.replace('k','') : '128',
      videoQuality: !isAudio ? format.replace('p','') : '720',
      filenameStyle: 'pretty',
      vCodec: 'h264'
    };
  },

  sanitize(fileName) {
    const ext = fileName.match(/\.[^.]+$/)?.[0] || '.mp4';
    const name = fileName.replace(ext, '');
    return (
      name.replace(/[^a-zA-Z0-9]/g,'_').replace(/_+/g,'_').toLowerCase() + ext
    );
  },

  async scrape(url, format) {
    const { url: downloadUrl, filename } = await this.convert(url, format);

    return {
      fileName: this.sanitize(filename),
      format,
      downloadUrl
    };
  }
};

module.exports = async function(url, format='360p') {
  const data = await yt.scrape(url, format);
  return {
    success: true,
    fileName: data.fileName,
    format: data.format,
    downloadUrl: data.downloadUrl
  };
};