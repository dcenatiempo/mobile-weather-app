/*
 TODO:
 1) Better background colors - gradient
 2) style favorites button
 3) account for time zones (weather.offset)
 4) 

 */
 /** Global State **************************************************************/
var prodUrl = 'https://devins-weather-app.herokuapp.com/';
var devUrl = 'http://localhost:5000/';
var appUrl = prodUrl;

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
var currentLocationUpdated = new Event('currentLocationUpdated');

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
6) when flipping through weather cards, only display city if weather has not fetched yet
*/

myLocals = loadLocalStorage('myLocals');
// myLocals.unshift(undefined);
document.addEventListener('currentLocationUpdated', async () => {
  var index = isLocalinArray(currentLocation);
  if (index !== false) {
    myLocals.unshift(undefined);
    myLocals[0] = myLocals[index]
    myLocals.splice(index, 1);
    index = getIndex(cards);
  }
  else {
    myLocals.unshift(undefined);
    myLocals[0] = new Weather(currentLocation);
  }
  index = getIndex(cards);
  if (index === 0) // only render if on this card
    renderWeather(findFrontCard(cards), 0);
});
/* FIRST: Get current location, no matter what */
if ("geolocation" in navigator) {
  // use geolocation API
  navigator.geolocation.getCurrentPosition(getCurrentPositionCallback);
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

/** REST API calls ************************************************************/
function getCurrentPosition() {
  console.warn('Location may be innacurate if on mobile network');
  fetch('https://freegeoip.net/json/?callback=')
  .then(resp => {
    return resp.json();
  }).then(json => {
    currentLocation = new Local(json.lat, json.lon);
    getCity(currentLocation.lat, currentLocation.lon)
    .then(data=>{
      currentLocation.city = data.address.city;
      currentLocation.region = data.address.state;
      document.dispatchEvent(currentLocationUpdated);
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
    currentLocation.region = data.address.state;
    document.dispatchEvent(currentLocationUpdated);
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

function handleForwardLookup(card, resp, index) {
  var frontCardId = findFrontCard(cards);
  if ("error" in resp) {
    console.log("try again")
    renderBlankCard(frontCardId);
    var input = document.querySelector(`#${card} .city`);
    input.disabled = false;
    input.focus();
  }
  else {
    console.log("successfully added new location")
    saveLocation(index, resp);
    if (index != getIndex(cards)) {
      console.log('argh, you rotated before rendering');
      return;
    }
    renderWeather(frontCardId, index);
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
  var d = new Date(ms);
  var hour = d.getHours();
  return (hour%12 === 0 ? '12' : hour%12) + (hour>12?' PM': ' AM');
}
function get24Hour(ms) {
  var d = new Date(ms);
  var hour = d.getHours();
  return hour;
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
  card.querySelector('.city').value = '';
  card.querySelector('.city').placeholder = 'Enter Location';
  card.querySelector('.city').classList.remove('filled');
  card.querySelector('.city').disabled = false;
  card.querySelector('.todays-forecast .forecast').innerText = '';
  card.querySelector('.week-forecast .forecast').innerText = '';
  renderFavorites(cardId);
  renderHourlyBlank(card);
  renderWeeklyBlank(card);
}
function renderHourlyBlank(card) {
  card.querySelector('.summary .day').innerText = getShortDay(new Date());
  card.querySelector('.summary .time').innerText = getHour(new Date());
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
    li[index].querySelector('.day').innerText = getDay(today.setDate(today.getDate()+(index*1)));
    li[index].querySelector('.weather-icon').className = `weather-icon`;
    li[index].querySelector('.temp .hi').innerText = '--';
    li[index].querySelector('.temp .lo').innerText = '--';
  }
}

// Card Downloading Weather
function renderDownloadCard(cardId, index) {
  var card = document.getElementById(cardId);
  card.querySelector('.city').value = myLocals[index].local.city;
  // card.querySelector('.city').style.pointerEvents = 'none';
  // card.querySelector('.city').style.cursor = 'text';
  card.querySelector('.todays-forecast .forecast').innerText = 'Getting weather...';
  card.querySelector('.week-forecast .forecast').innerText = 'Getting weather...';
  renderFavorites(cardId, index);
  renderHourlyDownload(card);
  renderWeeklyDownload(card);
}
function renderHourlyDownload(card) {
  card.querySelector('.summary .day').innerText = getShortDay(new Date());
  card.querySelector('.summary .time').innerText = getHour(new Date());
  card.querySelector('.summary .weather-summary').innerText = 'Getting weather';
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
    li[index].querySelector('.day').innerText = getDay(today.setDate(today.getDate()+(index*1)));
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
    renderDownloadCard(cardId, index)
    await myLocals[index].fetchWeather();
  }
  if (index != getIndex(cards)) {
    console.log('argh, you rotated before rendering');
    return;
  }

  card.querySelector('.todays-forecast .forecast').innerText = myLocals[index].weather.hourly.summary;
  card.querySelector('.week-forecast .forecast').innerText = myLocals[index].weather.daily.summary;
  renderHourly(card, index, myLocals[index].sliderPos);
  renderWeekly(card, index);
}
function renderFavorites(cardId, index = null) {
  var card = document.getElementById(cardId);
  card.querySelector('.favorite').classList = 'favorite';
  if (index === null)
    card.querySelector('.favorite').classList.add('hidden');
  else if (index >= 0 && myLocals[index].favorite)
    card.querySelector('.favorite').classList.add('clicked');
}
function renderHourly(card, index, h) {
  var sunrise = get24Hour(myLocals[index].weather.daily.data[0].sunriseTime * 1000);
  var sunset = get24Hour(myLocals[index].weather.daily.data[0].sunsetTime * 1000);
  var currentHour = get24Hour(myLocals[index].weather.hourly.data[h].time*1000);
  if (currentHour === sunset || currentHour === sunrise) {
    card.classList.remove('daytime', 'nighttime');
    card.classList.add('twilight')
  }
  else if (currentHour > sunrise && currentHour < sunset) {
    card.classList.remove('twilight', 'nighttime');
    card.classList.add('daytime')
  }
  else if (currentHour < sunrise || currentHour > sunset) {
    card.classList.remove('daytime', 'twilight');
    card.classList.add('nighttime')
  }
  card.querySelector('.summary .day').innerText = getShortDay(myLocals[index].weather.hourly.data[h].time*1000);
  card.querySelector('.summary .time').innerText = getHour(myLocals[index].weather.hourly.data[h].time*1000);
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
  myLocals[index].weather.daily.data.forEach((day, index)=> {
    li[index].querySelector('.day').innerText = getDay(day.time*1000);
    li[index].querySelector('.weather-icon').className = `weather-icon ${day.icon}`;
    li[index].querySelector('.temp .hi').innerText = Math.round(day.temperatureHigh);
    li[index].querySelector('.temp .lo').innerText = Math.round(day.temperatureLow);
  })
}

/** Event Listeners ***********************************************************/
// favorites button
var favorites = document.querySelectorAll('.favorite');
favorites.forEach(button => {
  button.addEventListener('click', (e) => {
    var button = e.target;
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
    cards = rotateLeft(cards);
    updateFrontCard(cards);
    cardAnimation(cards);
  }
  else if (e.keyCode === 39) { // 'right arrow'
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
      animateDelete(findFrontCard(cards));
      deleteCard(myLocals, index)
      updateFrontCard(cards);
      cardAnimation(cards);
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
  if (!e.target.classList.contains('slider')) {
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
      cards = rotateRight(cards);
      updateFrontCard(cards);
      cardAnimation(cards);
      document.removeEventListener("touchmove", onTouchMove)
    } else if (xVelocity < -.5) {
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
        animateDelete(findFrontCard(cards));
        deleteCard(myLocals, index)
        updateFrontCard(cards);
        cardAnimation(cards);
        document.removeEventListener("touchmove", onTouchMove)
      }
    }
  }
}