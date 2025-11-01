
const axios = require('axios');
const ENDPOINT = 'https://tikwm.com/api/feed/search';

async function search(query = 'random jj am anime') {
  const body = new URLSearchParams({
    keywords: query,
    count: 10,
    cursor: 0,
    web: 1,
    hd: 1
  }).toString();

  const { data } = await axios.post(ENDPOINT, body, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (JJAnime/1.0)'
    }
  });

  const list = data?.data?.videos || [];
  return list.map(v => ({
    id: v.id,
    title: v.title,
    author: v.author?.nickname,
    username: v.author?.unique_id,
    views: v.play_count,
    like: v.digg_count,
    url: 'https://tikwm.com' + v.play,
    cover: 'https://tikwm.com' + (v.cover || v.origin_cover || ''),
    music: 'https://tikwm.com' + v.music
  }));
}

module.exports = { search };
