/**
 * retrieves all playlistItems from YouTube's API, filters them for user's keywords, creates an object 
 * containing needed data to create a videoCard and embedCard then verifies it's valid and public. Each
 * object is added to an array, where each video is verified to be valid and public, before being returned.
 * 
 * @param {string} apiKey 
 * @param {string} playlistId dissected ID of playlist to search
 * @returns {Object[]} an array of video objects
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


/**
 * retrieves the playlistID after dissecting it from the playlist text input field
 * 
 * @returns the playlistID
 */
function dissectPlaylistURL() {
  const url = document.getElementById("playlistLink").value;
  const listIDPrefix = "list=";
  let listID = url.substring(url.indexOf(listIDPrefix) + listIDPrefix.length);
  let tail = listID.indexOf('&');

  return tail === -1 
         ? listID
         : listID.substring(0, tail);
}

/**
 * retrieves the keywords after dissecting them from keywords text input field
 * 
 * @returns an array of keywords
 */
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
    }

    keywords.push(keywordsString.slice(openingQuoteIndex + 1, closingQuoteIndex - 1));
    keywordsString = keywordsString.substring(0, openingQuoteIndex -1) + keywordsString.substring(closingQuoteIndex+1);
  }

  keywords = keywords.concat(keywordsString.split(" "));

  return keywords;
}

/**
 * Searches each of the item's user selected fields for each AND every keyword
 * 
 * @param {Object} item playlistItem resource retrieved from YouTube's API
 * @param {string[]} keywords keywords to search for
 * @returns true if all keywords are found in the playlistItem
 */
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

/**
 * checks if the videoText contains the keyword, or checks that it does not contain the keyword if
 *  the keyword begins with a "-".
 * 
 * @param {string} videoText all of the video's text that the user would like to search
 * @param {string} keyword the keyword to search for
 * @returns 
 */
function checkForKeyword(videoText, keyword){
  if(keyword[0] === "-"){
    return videoText.indexOf(keyword.substring(1)) === -1;
  }
  return videoText.indexOf(keyword) !== -1;
}

/**
 * Cleans up old videocards before creating a videoCard for each given video and appending it to the DOM
 * 
 * @param {Object[]} videos an array of video objects
 */
function displayVideos(videos){
  const videoListContainer = document.getElementById("videoListContainer");
  while(videoListContainer.firstChild){
    videoListContainer.removeChild(videoListContainer.lastChild);
  }
  videos.map((video, index) => {
    videoListContainer.appendChild(makeVideoCard(video, index));
  });
}

/**
 * Creates a videoCard node
 * 
 * @param {Object} video an object containing all information needed to create the videoCard
 * @param {integer} index 
 * @returns the videoCard node
 */
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

/**
 * cleans up old embedCards before creating a youtubeEmbedCard object and appending 
 * each to the DOM
 * 
 * @param {Object[]} videos an array of video objects
 */
function placeYoutubeEmbedCards(videos){
  const youtubeEmbedContainer = document.getElementById("youtubeEmbedContainer");
  while(youtubeEmbedContainer.firstChild){
    youtubeEmbedContainer.removeChild(youtubeEmbedContainer.lastChild);
  }
  videos.map((video, index) => youtubeEmbedContainer.appendChild(makeYoutubeEmbedCard(video, index)));
}

/**
 * takes the video and creates an embedCard with all relevant data, then returns the embedCard
 * 
 * @param {Object} video an object containing all needed data to create an embedCard
 * @param {integer} index 
 * @returns an embedCard object
 */
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

/**
 * Callback for an event listener hide the old embedCard and toggle the new embedCard when the associated
 * videoCard is clicked
 * 
 * @param {Object} event an eventObject
 */
function toggleVideoEmbed(embedCard) { 
  let oldVideoEmbed = document.querySelector(".show");
  if(oldVideoEmbed){
    oldVideoEmbed.classList.toggle("show");
  }
  embedCard.classList.toggle("show");
}

/**
 * Creates an errorScreen object with error's text and appends it to the DOM
 * 
 * @param {Object} error 
 */
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

/**
 * Toggles the infoScreen between hidden/shown
 */
function toggleInfoScreen(){
  let infoScreen = document.querySelector(".infoScreen");
  infoScreen.classList.toggle("show");
}

/**
 * Toggles the loadingScreen between hidden/shown
 */
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


//event listener stuff
let videoListContainer = document.getElementById("videoListContainer");
let searchPlaylistButton = document.getElementById("searchPlaylistButton");
let showInformationButton = document.getElementById("informationButton");
let errorCloseButton = document.getElementById("errorCloseButton");
let infoCloseButton = document.getElementById("infoCloseButton");
showInformationButton.addEventListener("click", toggleInfoScreen);
infoCloseButton.addEventListener("click", toggleInfoScreen); 
errorCloseButton.addEventListener("click", toggleErrorScreen);
window.addEventListener("click", windowOnClick);

videoListContainer.addEventListener('click', (event)=>{
  const target = event.target.closest(".videoCard");
  if(target.matches('.videoCard')){
    toggleVideoEmbed(document.getElementById("embedCard" + target.lastChild.textContent));
  }
});