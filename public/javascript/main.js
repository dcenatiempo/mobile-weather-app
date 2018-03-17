/*
 TODO:
 5) pull down to refresh
 7) fix safari issures - geocoding
 8) offline mode

 */
 /** Global State **************************************************************/
if (navigator.vendor.indexOf('Apple') >= 0) {
  console.log('you are on safari');
  document.documentElement.classList.add('safari');
}

var prodUrl = 'https://devins-weather-app.herokuapp.com/';
var devUrl = 'http://localhost:5000/';
var appUrl = devUrl;

class Local {
  constructor(lat, lon) {
    this.lat = lat;
    this.lon = lon;
    this.city = undefined;
    this.region = undefined
  }
}
async function fetchWeather(local) {
  var weather;
  var path = 'weather/'
  var url = appUrl + path + local.lat + ',' + local.long;

  var resp = await fetch(url);
  var json = await resp.json();
  weather = await json;
  this.weather = weather;
}

class Weather {
  constructor(local) {
    this.local = local;
    this.sliderPos = "0";
    this.favorite = false;
    this.weather = undefined;
  }

  async fetchWeather() {
    var weather;
    var path = 'weather/'
    var url = appUrl + path + this.local.lat + ',' + this.local.lon;
  
    var resp = await fetch(url);
    var json = await resp.json();
    weather = await json;
    this.weather = weather;
  }

  toggleFavorite() {
    this.favorite = !this.favorite;
  }
}

var touchStart;
var currentLocation = null;  // current location
var myLocals = [];           // array of saved locations
var cards = {                // position of 2 weather cards in DOM
  a: {
    rotation: 0,
    position: 0 //'front'
  },
  b: {
    rotation: 180,
    position: 1 //'back'
  },
};

/** Local Storage *************************************************************/
function saveLocation(index, current) {
  myLocals[index] = new Weather(current);
  saveToLocalStorage(myLocals);
}

function saveToLocalStorage(myLocals) {
  var locals = myLocals
    .filter((local) => local.favorite === true)
    .map((local) => local.local);
  localStorage.setItem('myLocals', JSON.stringify(locals))
}

function saveToSessionStorage(item) {
  sessionStorage.setItem('myLocals', JSON.stringify(item))
}

function loadLocalStorage(key) {
  var myLocals = [];
  if (key in localStorage) {
    let temp = JSON.parse(localStorage.getItem(key));
    myLocals = temp.map((local) => new Weather(local));
    myLocals.forEach((local) => local.toggleFavorite())
  }
  return myLocals;
}

function loadSessionStorage(key) {
  if (key in sessionStorage)
    return JSON.parse(localStorage.getItem(key));
  else
    return [];
}

function deleteCard(myLocals, index) {
  myLocals.splice(index, 1);
  saveToLocalStorage(myLocals);
}

function isLocalinArray(current) {
  var result = false;
  myLocals.forEach((item, index) => {
    if (item) {
    if (current.city === item.local.city && current.region === item.local.region)
      result = index;
    }
  })
  return result;
}
/** Program Flow **************************************************************/
/*
1) open app
2) fetch current location
3) fetch current location weather
3) render current location weather as "home page"
4) compare current location to saved locations
5) fetch saved location weather (unless any saved location is current location)
*/

/* 1) load local storage, if any */
myLocals = loadLocalStorage('myLocals');

(function initialTime(){
  var card = document.querySelector('#a');
  card.querySelector('.summary .day').innerText = getShortDay(applyTimeZone(0, (new Date()).getTime()));
  card.querySelector('.summary .time').innerText = getHour(applyTimeZone(0, (new Date()).getTime()));
})();

/* 2) get weather for all locations */
if (myLocals.length > 0) {
  console.log('you have locations!')
  myLocals.forEach(place=>{
    place.fetchWeather();
  });
}

/* 3) get current location */
if ("geolocation" in navigator) {
  // use geolocation API
  try{
  navigator.geolocation.getCurrentPosition(getCurrentPositionCallback);
  }
  catch(e){
    getCurrentPosition();
  }
  // check to see if permission denied
  try{
    navigator.permissions.query({name:'geolocation'})
    .then(resp =>{
      if (resp.state === "denied")
        getCurrentPosition();
    });
  }
  catch(e){
    // In safari, this will always catch
    // Wait to see if geolocation API works,
    //   if not, use alternate geo API
    setTimeout(()=>{
      if (!currentLocation)
      getCurrentPosition();
    },1000);
  }
} else {
  getCurrentPosition();
}

/* When current location is fetched, do this*/
async function currentLocationUpdated() {
  var index = isLocalinArray(currentLocation);
  if (index !== false) {
    myLocals.unshift(undefined);
    myLocals[0] = myLocals[index + 1]
    myLocals.splice(index + 1, 1);
    index = getIndex(cards);
  }
  else {
    myLocals.unshift(undefined);
    myLocals[0] = new Weather(currentLocation);
  }
  index = getIndex(cards);
  if (index === 0) // only render if on this card
    renderWeather(findFrontCard(cards), 0);
}

/** REST API calls ************************************************************/
function getCurrentPosition() {
  console.warn('Location may be innacurate if on mobile network');
  fetch('https://freegeoip.net/json/?callback=')
  .then(resp => {
    return resp.json();
  }).then(json => {
    currentLocation = new Local(json.latitude, json.longitude);
    getCity(currentLocation.lat, currentLocation.lon)
    .then(data=>{
      currentLocation.city = data.address.city;
      currentLocation.region = data.address.region;
      currentLocationUpdated();
    })
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
  });
}

async function getCurrentPositionCallback(pos) {
  currentLocation = new Local(pos.coords.latitude, pos.coords.longitude)
  getCity(currentLocation.lat, currentLocation.lon)
  .then(data=>{
    currentLocation.city = data.address.city;
    currentLocation.region = data.address.region;
    currentLocationUpdated();
  })
  .catch(err => {
    console.error(err);
    console.warn("trouble getting location")
  });
}

async function getCity(lat, long){
  var path = 'location/reverse/'
  var url = appUrl + path + lat + ',' + long;
  resp = await fetch(url);
  json = await resp.json();
  return json;
}

async function getWeather(myLocal){
  var weather;
  var path = 'weather/'
  var url = appUrl + path + myLocal.lat + ',' + myLocal.long;

  var resp = await fetch(url);
  var json = await resp.json();
  weather = await json;
  return weather;
}

function handleForwardLookup(cardId, resp, index) {
  if ("error" in resp) {
    console.log("try again")
    renderBlankCard(cardId);
  }
  else {
    console.log("successfully added new location")
    saveLocation(index, resp);
    if (index != getIndex(cards)) {
      console.log('argh, you rotated before rendering');
      return;
    }
    addAnimations();
    renderWeather(cardId, index);
  }
}

async function forwardLookup(city) {
  var path = 'location/forward/'
  var url = appUrl + path + city;
  resp = await fetch(url);
  json = await resp.json();
  return json;
}

/** Helper Functions **********************************************************/
function findFrontCard(cards) {
  var front;
  for (card in cards) {
    if (normalizePos(cards[card].position) === 0)
      return card;
  }
}

function posToClass (num) {
  var pos = normalizePos(num);
  return pos === 0 ? 'front' : 'back';
}

function normalizePos(pos) {
  var mod = pos%2;
  if (mod < 0) {
    while (mod <0){
      mod = mod+2
    }
  }
  return mod;
}

function getIndex(cards) {
  return Math.abs(cards.a.position);
}

function getDay(ms) {
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var d = new Date(ms);
  var day = d.getDay();
  return days[day];
}

function getShortDay(ms) {
  return getDay(ms).slice(0,3);
}

function getHour(ms) {
  debugger
  var d = new Date(ms);
  var hour = d.getHours();
  return (hour%12 === 0 ? '12' : hour%12) + (hour>=12?' PM': ' AM');
}
function get24Hour(ms) {
  var d = new Date(ms);
  var hour = d.getHours();
  return hour;
}

function applyTimeZone(index, ms) {
  if (!myLocals[index].weather) return ms;
  var myZone = myLocals[0].weather.offset;
  var yourZone = myLocals[index].weather.offset;
  var diff = yourZone - myZone;
  var msDelta = diff * 3600000;
  return ms + msDelta;
}

/** Card Rotation State *******************************************************/
function rotateLeft (cards) {
  if (myLocals.length + cards.a.position > 0) {
    return {
      a: {
        rotation: cards.a.rotation -180,
        position: cards.a.position - 1
      },
      b: {
        rotation: cards.b.rotation -180,
        position: cards.b.position - 1
      }
    }
  }
  else return cards;
}

function rotateRight (cards) {
  if (myLocals.length + cards.a.position < myLocals.length) {
    return {
      a: {
        rotation: cards.a.rotation +180,
        position: cards.a.position + 1
      },
      b: {
        rotation: cards.b.rotation +180,
        position: cards.b.position + 1
      }
    }
  }
  else return cards;
}

// Decides wether front card should be blank or weather card
function updateFrontCard(cards) {
  var index = getIndex(cards);
  var length = myLocals.length;
  var frontCardId = findFrontCard(cards);
  if (length - index <= 0)
    renderBlankCard(frontCardId);
  else
    renderWeather(frontCardId, index);
}

// apply css to animate cards based on card state
function cardAnimation(cards) {
  var card;
  for (let key in cards) {
    card = document.querySelector(`#${key}`);
    card.classList.remove('front', 'back');
    card.classList.add(`${posToClass(cards[key].position)}`);
    card.style.transform = `rotateY(${cards[key].rotation}deg)`;
  }
}

/** Weather Card Rendering ****************************************************/
// Blank Weather Card
function renderBlankCard(cardId) {
  var card = document.getElementById(cardId);
  card.setAttribute('status', 'blank');
  card.setAttribute('time', 'daytime')
  /*******************************/
  var cityInput = card.querySelector(`.city`);
  cityInput.value = '';
  cityInput.placeholder = 'Enter Location';
  cityInput.classList.remove('filled');
  cityInput.disabled = false;
  cityInput.focus();
  card.querySelector('.todays-forecast .forecast').innerText = '';
  card.querySelector('.week-forecast .forecast').innerText = '';
  renderFavorites(cardId);
  renderHourlyBlank(card);
  renderWeeklyBlank(card);
}
function renderHourlyBlank(card) {
  card.querySelector('.summary .day').innerText = getShortDay(applyTimeZone(0, (new Date()).getTime()));
  card.querySelector('.summary .time').innerText = getHour(applyTimeZone(0, (new Date()).getTime()));
  card.querySelector('.summary .weather-summary').innerText = '';
  card.querySelector('.todays-forecast .weather-icon').className = `weather-icon`;
  card.querySelector('.todays-forecast .temp').innerText = '--';
  card.querySelector('.todays-forecast .precip').innerText = '--';
  card.querySelector('.todays-forecast .humidity').innerText = '--';
  card.querySelector('.todays-forecast .windSpeed').innerText = '--';
  card.querySelector('.slider').value = "0";
}
function renderWeeklyBlank(card) {
  var li = card.querySelectorAll('.week li');
  var today = new Date();
  for (let index=0; index<li.length; index++) {
    li[index].querySelector('.day').innerText = getDay(applyTimeZone(0,today.setDate(today.getDate()+(index*1))));
    li[index].querySelector('.weather-icon').className = `weather-icon`;
    li[index].querySelector('.temp .hi').innerText = '--';
    li[index].querySelector('.temp .lo').innerText = '--';
  }
}

// Card Downloading Weather
function renderDownloadCard(cardId, index) {
  var card = document.getElementById(cardId);
  card.setAttribute('status', 'downloading');
  card.querySelector('.city').value = myLocals[index].local.city;
  // card.querySelector('.city').style.pointerEvents = 'none';
  // card.querySelector('.city').style.cursor = 'text';
  card.querySelector('.todays-forecast .forecast').innerText = 'Getting weather...';
  card.querySelector('.week-forecast .forecast').innerText = '';
  renderFavorites(cardId, index);
  renderHourlyDownload(card);
  // renderWeeklyDownload(card);
}
function renderHourlyDownload(card) {
  card.querySelector('.summary .day').innerText = getShortDay(applyTimeZone(0, (new Date()).getTime()));
  card.querySelector('.summary .time').innerText = getHour(applyTimeZone(0, (new Date()).getTime()));
  card.querySelector('.summary .weather-summary').innerText = '';
  card.querySelector('.todays-forecast .weather-icon').className = `weather-icon unknown`;
  card.querySelector('.todays-forecast .temp').innerText = '--';
  card.querySelector('.todays-forecast .precip').innerText = '--';
  card.querySelector('.todays-forecast .humidity').innerText = '--';
  card.querySelector('.todays-forecast .windSpeed').innerText = '--';
  card.querySelector('.slider').value = "0";
}
function renderWeeklyDownload(card) {
  var li = card.querySelectorAll('.week li');
  var today = new Date();
  for (let index=0; index<li.length; index++) {
    li[index].querySelector('.day').innerText = getDay(applyTimeZone(0,today.setDate(today.getDate()+(index*1))));
    li[index].querySelector('.weather-icon').className = `weather-icon unknown`;
    li[index].querySelector('.temp .hi').innerText = '--';
    li[index].querySelector('.temp .lo').innerText = '--';
  }
}

// Card with weather
async function renderWeather(cardId, index) {
  var card = document.getElementById(cardId);
  card.querySelector('.city').value = myLocals[index].local.city;
  card.querySelector('.city').classList.add('filled');
  card.querySelector('.city').disabled = true;
  renderFavorites(cardId, index);

  if (!myLocals[index].weather) {
    addAnimations();
    renderDownloadCard(cardId, index)
    await myLocals[index].fetchWeather();
  }
  if (index != getIndex(cards)) {
    console.log('argh, you rotated before rendering');
    return;
  }
  card.setAttribute('status', 'ready');
  card.querySelector('.todays-forecast .forecast').innerText = myLocals[index].weather.hourly.summary;
  card.querySelector('.week-forecast .forecast').innerText = myLocals[index].weather.daily.summary;
  renderHourly(card, index, myLocals[index].sliderPos);
  renderWeekly(card, index);
}
function renderFavorites(cardId, index = null) {
  var card = document.getElementById(cardId);
  var fav = card.querySelector('.favorite');
  if (index === null)
    fav.classList.add('hidden');
  else if (index >= 0 && myLocals[index].favorite) {
    fav.classList.add('clicked');
    fav.classList.remove('hidden');
  }
  else
    fav.classList.remove('clicked', 'animate', 'hidden');
}
function renderHourly(card, index, h) {
  var sunrise = get24Hour(applyTimeZone(index, myLocals[index].weather.daily.data[0].sunriseTime * 1000));
  var sunset = get24Hour(applyTimeZone(index, myLocals[index].weather.daily.data[0].sunsetTime * 1000));
  var currentHour = get24Hour(applyTimeZone(index, myLocals[index].weather.hourly.data[h].time*1000));
  if (currentHour === sunset || currentHour === sunrise)
    card.setAttribute('time', 'twilight');
  else if (currentHour > sunrise && currentHour < sunset)
    card.setAttribute('time', 'daytime');
  else if (currentHour < sunrise || currentHour > sunset)
    card.setAttribute('time', 'nighttime');

  card.querySelector('.summary .day').innerText = getShortDay(applyTimeZone(index, myLocals[index].weather.hourly.data[h].time*1000));
  card.querySelector('.summary .time').innerText = getHour(applyTimeZone(index, myLocals[index].weather.hourly.data[h].time*1000));
  card.querySelector('.summary .weather-summary').innerText = myLocals[index].weather.hourly.data[h].summary;
  card.querySelector('.todays-forecast .weather-icon').className = `weather-icon ${myLocals[index].weather.hourly.data[h].icon}`;
  card.querySelector('.todays-forecast .temp').innerText = Math.round(myLocals[index].weather.hourly.data[h].temperature);
  card.querySelector('.todays-forecast .precip').innerText = Math.round(myLocals[index].weather.hourly.data[h].precipProbability * 100);
  card.querySelector('.todays-forecast .humidity').innerText = Math.round(myLocals[index].weather.hourly.data[h].humidity * 100);
  card.querySelector('.todays-forecast .windSpeed').innerText = Math.round(myLocals[index].weather.hourly.data[h].windSpeed);
  card.querySelector('.slider').value = h;
}
function renderWeekly(card, index) {
  var li = card.querySelectorAll('.week li');
  myLocals[index].weather.daily.data.forEach((day, i)=> {
    li[i].querySelector('.day').innerText = getDay(applyTimeZone(index,day.time*1000));
    li[i].querySelector('.weather-icon').className = `weather-icon ${day.icon}`;
    li[i].querySelector('.temp .hi').innerText = Math.round(day.temperatureHigh);
    li[i].querySelector('.temp .lo').innerText = Math.round(day.temperatureLow);
  })
}

/** Event Listeners ***********************************************************/
// remove hover effects if on touch device
document.addEventListener('touchstart', function addtouchclass(e){ 
  document.documentElement.classList.remove('no-touch');
  document.removeEventListener('touchstart', addtouchclass, false);
}, false)

// favorites button
var favorites = document.querySelectorAll('.favorite');
favorites.forEach(button => {
  button.addEventListener('click', (e) => {
    var button = e.target;
    addAnimations();
    button.classList.add('animate');
    var index = getIndex(cards);
    var cardId = findFrontCard(cards);
    myLocals[index].toggleFavorite();
    renderFavorites(cardId, index);
    saveToLocalStorage(myLocals);
  })
});
// Rotate with arrow keys
window.addEventListener('keydown', e => {
  if (e.keyCode === 37) { // 'left arrow'
    removeAnimations();
    cards = rotateLeft(cards);
    updateFrontCard(cards);
    cardAnimation(cards);
  }
  else if (e.keyCode === 39) { // 'right arrow'
    removeAnimations();
    cards = rotateRight(cards);
    updateFrontCard(cards);
    cardAnimation(cards);
  }
  else if (e.keyCode === 8) { // 'delete'
    var index = getIndex(cards);
    if (index >= myLocals.length)
      console.log('cannot delete this card')
    else {
      console.log('delete card');
      removeAnimations();
      animateDelete(findFrontCard(cards));
      //this prevents re-rendering card data till card is off screen
      setTimeout( () => {
        deleteCard(myLocals, index);
        updateFrontCard(cards);
        cardAnimation(cards);
      },400);
    }
  }
})

function animateDelete(cardId) {
  var card = document.querySelector(`#${cardId}`);
  card.classList.add('delete');
  setTimeout(()=>{
    card.classList.remove('delete');
  },1000);
}

// Range Slider
var sliders = document.querySelectorAll('.slider');
for (let i=0; i<sliders.length; i++) {
  sliders[i].addEventListener('input', (e) => {
    addAnimations();
    var card = e.target.parentNode.parentNode
    var index = getIndex(cards);
    myLocals[index].sliderPos = e.target.value;
    renderHourly(card, getIndex(cards), myLocals[index].sliderPos);
  })
}

// City Input
var cityInput = document.querySelectorAll('.city');
for (let i=0; i<cityInput.length; i++) {
  cityInput[i].addEventListener('blur', async e => {
    if (e.target.value === '') return;
    if (e.target.disabled === true) return;

    var card = e.target.parentNode.parentNode.id;
    e.target.disabled = true;
    index = getIndex(cards);
    let resp = await forwardLookup(e.target.value);
    handleForwardLookup(card, resp, index);
  });
  cityInput[i].addEventListener('keypress', async e => {
    if (e.keyCode === 13) {
      if (e.target.value === '') return;
      var card = e.target.parentNode.parentNode.id;
      e.target.disabled = true;
      index = getIndex(cards);
      let resp = await forwardLookup(e.target.value);
      handleForwardLookup(card, resp, index);
    }
  })
}

// Swiping Left/Right
document.addEventListener("touchstart", (e)=> {
  if (!e.target.classList.contains('slider') && !e.target.classList.contains('favorite')) {
    document.addEventListener("touchmove", onTouchMove)
  }
  touchStart = {
    y: e.changedTouches[0].clientY,
    x: e.changedTouches[0].clientX,
    time: e.timeStamp
  }
})

function onTouchMove (e) {
  var x = e.changedTouches[0].clientX;
  var y = e.changedTouches[0].clientY;
  var time = e.timeStamp;
  var xVelocity = (x-touchStart.x)/(time-touchStart.time);
  var yVelocity = (y-touchStart.y)/(time-touchStart.time);
  if (Math.abs(xVelocity) >= Math.abs(yVelocity)) {
    console.log('x wins!')
    console.log(xVelocity)
    if (xVelocity > .5) {
      removeAnimations();
      cards = rotateRight(cards);
      updateFrontCard(cards);
      cardAnimation(cards);
      document.removeEventListener("touchmove", onTouchMove)
    } else if (xVelocity < -.5) {
      removeAnimations();
      cards = rotateLeft(cards);
      updateFrontCard(cards);
      cardAnimation(cards)
      document.removeEventListener("touchmove", onTouchMove)
    } else {
      touchStart = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: e.timeStamp
      }
    }
  }
  else {
    console.log('y wins!')
    console.log(yVelocity)
    if (yVelocity < -.5) {
      var index = getIndex(cards);
      if (index >= myLocals.length)
        console.log('cannot delete this card')
      else {
        console.log('delete card');
        removeAnimations();
        animateDelete(findFrontCard(cards));
        //this prevents re-rendering card data till card is off screen
        setTimeout( () => {
          deleteCard(myLocals, index);
          updateFrontCard(cards);
          cardAnimation(cards);
        },400);
        document.removeEventListener("touchmove", onTouchMove)
      }
    }
  }
}

/* add/removeAnimations() are necissary so that cards
 * do not animate or transition while "flipping" the cards
 */
function addAnimations() {
  if (!document.documentElement.classList.contains('animate'))
    document.documentElement.classList.add('animate');
}

function removeAnimations() {
  if (document.documentElement.classList.contains('animate'))
    document.documentElement.classList.remove('animate');
}