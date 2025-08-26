/**
 * gets details of videos in given playlist
 * 
 * @param {string} apiKey 
 * @param {string} playlistId
 * @returns {array} videos - an array of video objects, which contains its title, description, channeltitle, tags, and category
 */
async function getPlaylistVideos(apiKey, playlistId) {
  let videos = [];
  let nextPageToken = '';
  do {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
    );
    const data = await res.json();
    videos = videos.concat(data.items.map(item => ({
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      tags: item.snippet.tags,
      category: item.categoryId
    })));
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return videos;
}

getPlaylistVideos('AIzaSyAwNFc3VpJCLpnqU677Zrfm5c8ct0fEb5o', 'PLW4MUYtOYOnu7XwnQ2veHBj10FCipgiNC')
  .then(videos => console.log(videos));

function dissectPlaylistURL(url) {
    var listIDPrefix = "list=";
    return url.substring(url.indexOf(listIDPrefix) + listIDPrefix.length);
}
