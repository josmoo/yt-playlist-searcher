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
      channelTitle: item.snippet.videoOwnerChannelTitle,
      thumbnail: item.snippet.thumbnails.default
    })));
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return videos.filter((video) => video.description !== "This video is unavailable." 
                               && video.description !== "This video is private.");
}

// https://www.youtube.com/watch?v=UwxatzcYf9Q&list=PLW4MUYtOYOnsMPKysEpLYBXryNi9RpEET
// https://www.youtube.com/watch?v=xXahlXQhMF4&list=PLW4MUYtOYOnu7WWY7hlPonUehcZX6Ue0F

getPlaylistVideos('AIzaSyAwNFc3VpJCLpnqU677Zrfm5c8ct0fEb5o',
   dissectPlaylistURL('https://www.youtube.com/watch?v=UwxatzcYf9Q&list=PLW4MUYtOYOnsMPKysEpLYBXryNi9RpEET'))
  .then(videos => displayVideos(videos));

function dissectPlaylistURL(url) {
    const listIDPrefix = "list=";
    let listID = url.substring(url.indexOf(listIDPrefix) + listIDPrefix.length);
    let tail = listID.indexOf('&');

    return tail === -1 
           ? listID
           : listID.substring(0, tail);
}


//DOM MANIP
let infoPopup = document.querySelector(".infoPopup");
let showInformationButton = document.querySelector("#informationButton")
let closeButton = document.querySelector(".closeButton");

function toggleInfoPopup() {
  console.log("toggleinfopopup");
  infoPopup.classList.toggle("showInfoPopup")
}

function windowOnClick(event){
  console.log("windowclick");
  if(event.target === infoPopup){
    toggleInfoPopup;
  }
}

function displayVideos(videos){
  const videoListContainer = document.querySelector("#videoListContainer");
  videos.map((video) => videoListContainer.appendChild(makeVideoCard(video)));
}

function makeVideoCard(video){
  let card = document.createElement("div");
  card.classList.add("videoCard");

  let thumbnail = document.createElement("img");
  console.log(video);
  thumbnail.src = video.thumbnail.url;
  thumbnail.width = video.thumbnail.width;
  thumbnail.height = video.thumbnail.height;

  let titleContainer = document.createElement("div");
  titleContainer.classList.add("videoTitleContainer");

  let title = document.createElement("h3");
  title.textContent = video.title;
  titleContainer.appendChild(title);

  

  let channelTitle = document.createElement("h4");
  channelTitle.textContent = video.channelTitle;

  card.appendChild(thumbnail);
  card.appendChild(titleContainer);
  card.appendChild(channelTitle);

  return card;
}

showInformationButton.addEventListener("click", toggleInfoPopup);
closeButton.addEventListener("click", toggleInfoPopup); 
window.addEventListener("click", windowOnClick);
