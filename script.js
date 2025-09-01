/**
 * gets details of videos in given playlist
 * 
 * @param {string} apiKey 
 * @param {string} playlistId
 * @returns {array} videos - an array of video objects, which contains its title, description, channeltitle, tags, and category
 */
async function getPlaylistVideos(apiKey, playlistId, keywords) {
  let videos = [];
  let nextPageToken = '';
  do {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
    );
    const data = await res.json();
    videos = videos.concat(data.items.filter(item => doesItemContainKeywords(item, keywords))
                          .map(item => ({
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.videoOwnerChannelTitle,
      thumbnail: item.snippet.thumbnails.default,
      videoId: item.snippet.resourceId.videoId
    })));
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return videos.filter((video) => video.description !== "This video is unavailable." 
                               && video.description !== "This video is private.");
}

// https://www.youtube.com/watch?v=UwxatzcYf9Q&list=PLW4MUYtOYOnsMPKysEpLYBXryNi9RpEET
// https://www.youtube.com/watch?v=xXahlXQhMF4&list=PLW4MUYtOYOnu7WWY7hlPonUehcZX6Ue0F

function dissectPlaylistURL() {
  const url = document.getElementById("playlistLink").value;
  const listIDPrefix = "list=";
  let listID = url.substring(url.indexOf(listIDPrefix) + listIDPrefix.length);
  let tail = listID.indexOf('&');

  return tail === -1 
         ? listID
         : listID.substring(0, tail);
}

function getKeywords(){
  let keywordsString = document.getElementById("searchKeywords").value.toLowerCase();
  let keywords = [];

  //this handles phrases as keywords using quotes
  while(true){
    let openingQuoteIndex = keywordsString.indexOf('"');
    if(openingQuoteIndex === -1){
      break;
    }

    let closingQuoteIndex = keywordsString.indexOf('"', openingQuoteIndex + 1);
    if(closingQuoteIndex === -1 || closingQuoteIndex-2 < openingQuoteIndex){
      console.log("uh oh oopsy woopsy");
      break;
      //todo throw error and have error popup. i like the popup idea
    }

    keywords.push(keywordsString.slice(openingQuoteIndex + 1, closingQuoteIndex - 1));
    keywordsString = keywordsString.substring(0, openingQuoteIndex -1) + keywordsString.substring(closingQuoteIndex+1);
  }

  keywords = keywords.concat(keywordsString.split(" "));

  return keywords;
}

function doesItemContainKeywords(item, keywords){
  let textToSearch = "";
  if (document.querySelector("#searchTitleBool").checked){
    textToSearch += item.snippet.title.toLowerCase();
  }
  if (document.querySelector("#searchDescriptionBool").checked){
    textToSearch += item.snippet.description.toLowerCase();
  } 
  if (document.querySelector("#searchChannelTitleBool").checked){
    textToSearch += item.snippet.videoOwnerChannelTitle.toLowerCase();
  }

  return keywords.reduce((bool, keyword) => 
            doesTextContainKeyword(textToSearch, keyword) && bool, true);
}

//recursive function that appends index matches for a keyword. returns false if nothing is found
function doesTextContainKeyword(giantTextString, keyword){
  return giantTextString.indexOf(keyword) !== -1;
}

function displayVideos(videos){
  const videoListContainer = document.querySelector("#videoListContainer");
  while(videoListContainer.firstChild){
    videoListContainer.removeChild(videoListContainer.lastChild);
  }
  videos.map((video) => videoListContainer.appendChild(makeVideoCard(video)));
}

function makeVideoCard(video){
  let card = document.createElement("div");
  card.classList.add("videoCard");

  let thumbnail = document.createElement("img");
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

function makeYoutubeEmbedCard(videoUrl){

}

//event listeners
let videoCards = document.querySelectorAll(".videoCard")
let searchPlaylistButton = document.getElementById("searchPlaylistButton");
let infoPopup = document.querySelector(".infoPopup");
let showInformationButton = document.querySelector("#informationButton")
let closeButton = document.querySelector(".closeButton");

function toggleInfoPopup() {
  infoPopup.classList.toggle("showInfoPopup")
}

function windowOnClick(event){
  console.log(event.target);
  switch(event.target){

    case infoPopup:
      toggleInfoPopup;
      break;
    
    case searchPlaylistButton:
      getPlaylistVideos('AIzaSyAwNFc3VpJCLpnqU677Zrfm5c8ct0fEb5o',
        dissectPlaylistURL(),
        getKeywords())
      .then(videos => displayVideos(videos));
      break;

    case videoCards:
      console.log(event.target.classList);
      break;
  }
}

showInformationButton.addEventListener("click", toggleInfoPopup);
closeButton.addEventListener("click", toggleInfoPopup); 
window.addEventListener("click", windowOnClick);