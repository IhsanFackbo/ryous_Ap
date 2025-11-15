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
    const r = await fetch(this.static.baseUrl + '/v2/sanity/key', {
      headers: this.static.headers
    });
    if (!r.ok) throw new Error('Gagal ambil key');
    return r.json();
  },

  resolvePayload(link, format = '360p') {
    const allowed = ['128k','320k','144p','240p','360p','720p','1080p'];
    if (!allowed.includes(format))
      throw new Error(`Invalid format. Gunakan: ${allowed.join(', ')}`);

    const isAudio = format.endsWith('k');
    return {
      link,
      format: isAudio ? 'mp3' : 'mp4',
      audioBitrate: isAudio ? format.replace('k','') : '128',
      videoQuality: !isAudio ? format.replace('p','') : '720',
      filenameStyle: 'pretty',
      vCodec: 'h264'
    };
  },

  async convert(link, format) {
    const { key } = await this.getKey();
    const payload = this.resolvePayload(link, format);

    const r = await fetch(this.static.baseUrl + '/v2/converter', {
      method: 'POST',
      headers: { ...this.static.headers, key },
      body: new URLSearchParams(payload)
    });

    if (!r.ok) throw new Error('Gagal convert URL');
    return r.json();
  },

  async getDownloadURL(link, format = '360p') {
    const { url, filename } = await this.convert(link, format);
    const ext = filename.match(/\.[^.]+$/)?.[0] || '.mp4';
    const name = filename.replace(ext,'')
      .replace(/[^a-zA-Z0-9]+/g,'_')
      .replace(/_+/g,'_')
      .toLowerCase();
    return {
      fileName: (name || 'video') + ext,
      format,
      downloadUrl: url
    };
  }
};

module.exports = async (link, format = '360p') => {
  const { fileName, format: fmt, downloadUrl } = await yt.getDownloadURL(link, format);
  return {
    success: true,
    fileName,
    format: fmt,
    downloadUrl
  };
};