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
            checkForKeyword(textToSearch, keyword) && bool, true);
}

//recursive function that appends index matches for a keyword. returns false if nothing is found
function checkForKeyword(giantTextString, keyword){
  if(keyword[0] === "-"){
    return giantTextString.indexOf(keyword.substring(1)) === -1;
  }
  return giantTextString.indexOf(keyword) !== -1;
}

function displayVideos(videos){
  const videoListContainer = document.getElementById("videoListContainer");
  while(videoListContainer.firstChild){
    videoListContainer.removeChild(videoListContainer.lastChild);
  }
  videos.map((video, index) => {
    videoListContainer.appendChild(makeVideoCard(video, index))
                      .addEventListener("click", toggleVideoEmbed);
  });
}

function makeVideoCard(video, index){
  let videoCard = document.createElement("div");
  videoCard.classList.add("videoCard");

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

  let indexText = document.createElement("h5");
  indexText.textContent = index;

  videoCard.appendChild(thumbnail);
  videoCard.appendChild(titleContainer);
  videoCard.appendChild(channelTitle);
  videoCard.appendChild(indexText);

  return videoCard;
}

function placeYoutubeEmbedCards(videos){
  const youtubeEmbedContainer = document.getElementById("youtubeEmbedContainer");
  while(youtubeEmbedContainer.firstChild){
    youtubeEmbedContainer.removeChild(youtubeEmbedContainer.lastChild);
  }
  videos.map((video, index) => youtubeEmbedContainer.appendChild(makeYoutubeEmbedCard(video, index)));
}

function makeYoutubeEmbedCard(video, index){
  let embedCard = document.createElement("div");
  embedCard.classList.add("embedCard");
  embedCard.id = "embedCard" + index.toString();

  let videoEmbed = document.createElement("iframe");
  videoEmbed.src = "https://www.youtube.com/embed/" + video.videoId;


  let description = document.createElement("p");
  description.textContent = video.description;

  embedCard.appendChild(videoEmbed);
  embedCard.appendChild(description);

  return embedCard;
}

//event listeners
let searchPlaylistButton = document.getElementById("searchPlaylistButton");
let showInformationButton = document.querySelector("#informationButton");
let errorCloseButton = document.getElementById("errorCloseButton");
let infoCloseButton = document.getElementById("infoCloseButton");

function toggleVideoEmbed(event) { 
  let oldVideoEmbed = document.querySelector(".show");
  if(oldVideoEmbed){
    oldVideoEmbed.classList.toggle("show");
  }
  let videoEmbed = doc3ument.getElementById("embedCard" + event.currentTarget.lastChild.textContent);
  videoEmbed.classList.toggle("show");
}

function toggleErrorScreen(error){
  let errorBox = document.querySelector(".errorBox");
  let errorTexts = document.querySelectorAll(".errorText");
  errorTexts.forEach((errorText) => errorBox.removeChild(errorText));

  let errorText = document.createElement("p");
  errorText.classList.add("errorText");
  errorText.textContent = error;
  errorBox.appendChild(errorText);
  
  let errorScreen = document.querySelector(".errorScreen");
  errorScreen.classList.toggle("show");
}

function toggleInfoScreen(){
  let infoScreen = document.querySelector(".infoScreen");
  infoScreen.classList.toggle("show");
}

function toggleLoading(){
  let loadingScreen = document.querySelector(".loadingScreen");
  loadingScreen.classList.toggle("show");
}

function windowOnClick(event){
  switch(event.target){
    case searchPlaylistButton:
      toggleLoading();
      getPlaylistVideos('AIzaSyAwNFc3VpJCLpnqU677Zrfm5c8ct0fEb5o',
        dissectPlaylistURL(),
        getKeywords())
      .then(videos => {
          displayVideos(videos);
          placeYoutubeEmbedCards(videos);
          toggleLoading();
        })
      .catch(e =>{
        toggleErrorScreen(e);
        toggleLoading();
      });

      break;
  }
}

showInformationButton.addEventListener("click", toggleInfoScreen);
infoCloseButton.addEventListener("click", toggleInfoScreen); 
errorCloseButton.addEventListener("click", toggleErrorScreen);
window.addEventListener("click", windowOnClick);