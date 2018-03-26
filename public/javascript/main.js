/*
 TODO:
 1) Move work to server
 2) add animations to dropdown
 5) menu buttons - get current location, hamburger
 7) fix safari issures - geocoding
 8) offline mode

 */
 /** Global State **************************************************************/
if (navigator.vendor.indexOf('Apple') >= 0) {
  console.log('you are on safari');
  document.documentElement.classList.add('safari');
  
  window.addEventListener("load",function() {
    // Set a timeout...
    setTimeout(function(){
      // Hide the address bar!
      window.scrollTo(0, 1);
    }, 0);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

var prodUrl = 'https://devins-weather-app.herokuapp.com/';
var devUrl = 'http://localhost:5000/';
var appUrl = prodUrl;

class locale {
  constructor(lat, lon) {
    this.lat = lat;
    this.lon = lon;
    this.city = undefined;
    this.region = undefined;
    this.country = undefined;
    this.id = undefined;
  }
}
async function fetchWeather(locale) {
  var weather;
  var path = 'weather/'
  var url = appUrl + path + locale.lat + ',' + locale.long;

  var resp = await fetch(url);
  var json = await resp.json();
  weather = await json;
  this.weather = weather;
}

class Weather {
  constructor(locale) {
    this.locale = locale;
    this.sliderPos = "0";
    this.favorite = false;
    this.weather = undefined;
  }

  async fetchWeather() {
    var weather;
    var path = 'weather/'
    var url = appUrl + path + this.locale.lat + ',' + this.locale.lon;
  
    var resp = await fetch(url);
    var json = await resp.json();
    weather = await json;
    this.weather = weather;
  }

  toggleFavorite() {
    this.favorite = !this.favorite;
    if (this.favorite) {
      let cardId= findFrontCard(cards);
      document.querySelector(`#${cardId} .favorite`).classList.add('animate');
    }
  }
}

var touchStart;
var currentLocation = null;  // current location
var myLocales = [];           // array of saved locations
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
  myLocales[index] = new Weather(current);
  saveToLocalStorage(myLocales);
}

function saveToLocalStorage(myLocales) {
  var locales = myLocales
    .filter((locale) => locale.favorite === true)
    .map((locale) => locale.locale);
  localStorage.setItem('myLocales', JSON.stringify(locales))
}

function saveToSessionStorage(item) {
  sessionStorage.setItem('myLocales', JSON.stringify(item))
}

function loadLocalStorage(key) {
  var myLocales = [];
  if (key in localStorage) {
    let temp = JSON.parse(localStorage.getItem(key));
    myLocales = temp.map((locale) => new Weather(locale));
    myLocales.forEach((locale) => locale.toggleFavorite())
  }
  return myLocales;
}

function loadSessionStorage(key) {
  if (key in sessionStorage)
    return JSON.parse(localStorage.getItem(key));
  else
    return [];
}

function deleteCard(myLocales, index) {
  myLocales.splice(index, 1);
  saveToLocalStorage(myLocales);
}

function isLocaleInArray(current) {
  var result = false;
  myLocales.forEach((item, index) => {
    if (item) {
    if (current.city === item.locale.city && current.region === item.locale.region)
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
myLocales = loadLocalStorage('myLocales');
//create breadcrumbs
myLocales.forEach( l => addCrumb());

(function initialTime(){
  var card = document.querySelector('#a');
  card.querySelector('.summary .day').innerText = getShortDay((new Date()).getTime());
  card.querySelector('.summary .time').innerText = getHour((new Date()).getTime());
})();

/* 2) get weather for all locations */
if (myLocales.length > 0) {
  console.log('you have locations!')
  myLocales.forEach(place=>{
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
  var index = isLocaleInArray(currentLocation);
  var startLength = myLocales.length;
  if (index !== false) { // current location already in saved
    myLocales.unshift(undefined);
    myLocales[0] = myLocales[index + 1]
    myLocales.splice(index + 1, 1);
    index = getIndex(cards);
    if (startLength === 0) addCrumb();
  }
  else { // current location NOT in saved
    myLocales.unshift(undefined);
    myLocales[0] = new Weather(currentLocation);
    addCrumb();
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
    getCity(json.latitude, json.longitude)
    .then(data=>{
      currentLocation = data;
      currentLocationUpdated();
    })
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
  });
}

async function getCurrentPositionCallback(pos) {
  getCity(pos.coords.latitude, pos.coords.longitude)
  .then(data=>{
    currentLocation = data;
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

async function getWeather(myLocale){
  var weather;
  var path = 'weather/'
  var url = appUrl + path + myLocale.lat + ',' + myLocale.long;

  var resp = await fetch(url);
  var json = await resp.json();
  weather = await json;
  return weather;
}

function handleForwardLookup(cardId, resp, index) {
  clearUl();
  if ("error" in resp ) {
    console.log("No results, try again")
  }
  else { // success!
    console.log(resp)
    if (resp.length === 0) {
      console.log("No results, try again")
    }
    else if (resp.length === 1) {
      console.log("only 1 result!")
      let locale = resp[0];
      addNewlocale (locale, cardId, index);
    }
    else {
      // wait till list is completely gone
      let interval = setInterval(()=>{
        var list = document.querySelectorAll('#dropdown > ul > li');
        if (list.length === 0) {
          clearInterval(interval);
          resp.forEach( (item, i) => {
            createLi(item, i);
          });
        }
      }, 10);
    }
    
  }
}
function clearUl() {
  var ul = document.querySelector('#dropdown > ul');
  var list = document.querySelectorAll('#dropdown > ul > li');
  let length = list.length;
  if (length === 0) return;

 // make sure list is done growing
  let interval2 = setInterval(()=>{
    console.log(document.querySelectorAll('#dropdown > ul > li').length + "?===" + length)
    if (document.querySelectorAll('#dropdown > ul > li').length === length) {
      clearInterval(interval2);
      list = document.querySelectorAll('#dropdown > ul > li');
      let highlighted = length - 1;
      ul.classList.add('fade');
      list.forEach( (item, index) => {
        if (item.classList.contains('highlight'))
          highlighted = index;
      });

      let upcount = 0;
      for (let i=highlighted; i<length; i++) {
        setTimeout( () => {
          console.log('deleting ' + i)
          list[i].classList.add('fade');
        }, upcount*50);
        upcount++;
      }
      let downcount = 0;
      for (let i=highlighted-1; i>=0; i--) {
        setTimeout( () => {
          console.log('deleting ' + i)
          list[i].classList.add('fade');
        }, downcount*50);
        downcount++;
      }
      let time = highlighted >= length/2 ? highlighted : length - highlighted;
      console.log(time)
      setTimeout( () => {
        ul.innerHTML = '';
        ul.classList.remove('fade');
        addGlobalKeydown();
      }, time*50);

    }
    length = document.querySelectorAll('#dropdown > ul > li').length;
  }, 50);
}

function createLi(locale, i) {
  var ul = document.querySelector('#dropdown > ul');
  var li = document.createElement('li');
  var text = document.createTextNode(`${locale.city}, ${locale.region}, ${locale.country}`);
  li.appendChild(text);
  li.locale = locale;
  setTimeout( () =>{
    ul.appendChild(li);
  }, i*50);
}

function addNewlocale (locale, cardId, index) {
  console.log("successfully added new location");
  saveLocation(index, locale);
  if (index != getIndex(cards)) {
    console.log('argh, you rotated before rendering');
    return;
  }
  addAnimations();
  renderWeather(cardId, index);
  addCrumb();
  renderBreadcrumbs(cards);
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
  return (hour%12 === 0 ? '12' : hour%12) + (hour>=12?' PM': ' AM');
}
function get24Hour(ms) {
  var d = new Date(ms);
  var hour = d.getHours();
  return hour;
}

function applyTimeZone(index, ms) {
  if (!myLocales) return;
  if (!myLocales[0]) return
  if (!myLocales[index].weather) return ms;
  var myZone = myLocales[0].weather.offset;
  var yourZone = myLocales[index].weather.offset;
  var diff = yourZone - myZone;
  var msDelta = diff * 3600000;
  return ms + msDelta;
}
function get24Hour(ms) {
  var d = new Date(ms);
  var hour = d.getHours();
  return hour;
}

function getLocationString(locale) {
  if (locale.country === "USA")
    return `${locale.city}, ${locale.region}`;
  else
    return `${locale.city}, ${locale.country}`;
}

/** Card Rotation State *******************************************************/
function rotateLeft (cards) {
  if (myLocales.length + cards.a.position > 0) {
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
  if (myLocales.length + cards.a.position < myLocales.length) {
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
  var length = myLocales.length;
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
  setTimeout( () => {
    cityInput.focus(); },500);
  card.querySelector('.todays-forecast .summary .day').innerText = getShortDay(0, (new Date()).getTime());
  card.querySelector('.todays-forecast .summary .time').innerText = getHour(0, (new Date()).getTime());
  card.querySelector('.todays-forecast .summary .weather-summary').innerText = '';
  card.querySelector('.todays-forecast .forecast').innerText = '';
  card.querySelector('.week-forecast .forecast').innerText = '';
  renderFavorites(cardId);
  renderHourlyBlank(card);
  renderWeeklyBlank(card);
}
function renderHourlyBlank(card) {
  card.querySelector('.summary .day').innerText = getShortDay(0, (new Date()).getTime());
  card.querySelector('.summary .time').innerText = getHour(0, (new Date()).getTime());
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
  card.querySelector('.city').value = getLocationString(myLocales[index].locale);
  card.querySelector('.city').blur();
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
  card.querySelector('.city').value = getLocationString(myLocales[index].locale);
  card.querySelector('.city').classList.add('filled');
  card.querySelector('.city').disabled = true;
  renderFavorites(cardId, index);

  if (!myLocales[index].weather) {
    addAnimations();
    renderDownloadCard(cardId, index)
    await myLocales[index].fetchWeather();
  }
  if (index != getIndex(cards)) {
    console.log('argh, you rotated before rendering');
    return;
  }
  card.setAttribute('status', 'ready');
  card.querySelector('.todays-forecast .forecast').innerText = myLocales[index].weather.hourly.summary;
  card.querySelector('.week-forecast .forecast').innerText = myLocales[index].weather.daily.summary;
  renderHourly(card, index, myLocales[index].sliderPos);
  renderWeekly(card, index);
}
function renderFavorites(cardId, index = null) {
  var card = document.getElementById(cardId);
  var fav = card.querySelector('.favorite');
  if (index === null){
    fav.setAttribute('hidden', '');
    fav.classList.remove('animate');
  }
  else if (index >= 0 && myLocales[index].favorite) {
    fav.setAttribute('clicked', '');
    fav.removeAttribute('hidden');
  }
  else {
    fav.classList.remove('animate');
    fav.removeAttribute('clicked');
    fav.removeAttribute('hidden');
  }
}
function renderHourly(card, index, h) {
  var sunrise = get24Hour(applyTimeZone(index, myLocales[index].weather.daily.data[0].sunriseTime * 1000));
  var sunset = get24Hour(applyTimeZone(index, myLocales[index].weather.daily.data[0].sunsetTime * 1000));
  var currentHour = get24Hour(applyTimeZone(index, myLocales[index].weather.hourly.data[h].time*1000));
  if (currentHour === sunset || currentHour === sunrise)
    card.setAttribute('time', 'twilight');
  else if (currentHour > sunrise && currentHour < sunset)
    card.setAttribute('time', 'daytime');
  else if (currentHour < sunrise || currentHour > sunset)
    card.setAttribute('time', 'nighttime');

  card.querySelector('.summary .day').innerText = getShortDay(applyTimeZone(index, myLocales[index].weather.hourly.data[h].time*1000));
  card.querySelector('.summary .time').innerText = getHour(applyTimeZone(index, myLocales[index].weather.hourly.data[h].time*1000));
  card.querySelector('.summary .weather-summary').innerText = myLocales[index].weather.hourly.data[h].summary;
  card.querySelector('.todays-forecast .weather-icon').className = `weather-icon ${myLocales[index].weather.hourly.data[h].icon}`;
  card.querySelector('.todays-forecast .temp').innerText = Math.round(myLocales[index].weather.hourly.data[h].temperature);
  card.querySelector('.todays-forecast .precip').innerText = Math.round(myLocales[index].weather.hourly.data[h].precipProbability * 100);
  card.querySelector('.todays-forecast .humidity').innerText = Math.round(myLocales[index].weather.hourly.data[h].humidity * 100);
  card.querySelector('.todays-forecast .windSpeed').innerText = Math.round(myLocales[index].weather.hourly.data[h].windSpeed);
  card.querySelector('.slider').value = h;
}
function renderWeekly(card, index) {
  var li = card.querySelectorAll('.week li');
  myLocales[index].weather.daily.data.forEach((day, i)=> {
    li[i].querySelector('.day').innerText = getDay(applyTimeZone(index,day.time*1000));
    li[i].querySelector('.weather-icon').className = `weather-icon ${day.icon}`;
    li[i].querySelector('.temp .hi').innerText = Math.round(day.temperatureHigh);
    li[i].querySelector('.temp .lo').innerText = Math.round(day.temperatureLow);
  })
}

/** Event Listeners ***********************************************************/
// remove animate on resize
window.addEventListener('resize', () => {
  addResizing();
})

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
    myLocales[index].toggleFavorite();
    renderFavorites(cardId, index);
    saveToLocalStorage(myLocales);
  })
});

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
    myLocales[index].sliderPos = e.target.value;
    renderHourly(card, getIndex(cards), myLocales[index].sliderPos);
  })
}

// City Input
var cityInput = document.querySelectorAll('.city');
cityInput.forEach( input => {
  
  input.addEventListener('blur', e => {
    if (input.value === '') {
      clearUl();
      addGlobalKeydown();
    }
    // else handleCityInput(e)
  });

  input.addEventListener('input', e => {
    clearUl();
    if (input.value === '')
      addGlobalKeydown();
    else
      removeGlobalKeydown();
  });

  function handleArrowPress(list, dir) {
    let highlighted = -1;
    let length = list.length;
    if (length === 0) return;

    list.forEach( (item, index) => {
      if (item.classList.contains('highlight'))
        highlighted = index;
    });
    if (highlighted >=0)
    list[highlighted].classList.remove('highlight');

    if (dir === 'down') highlighted++;
    else if (dir === 'up') highlighted--;

    if (highlighted >= length) highlighted = 0;
    else if (highlighted < 0) highlighted = -1;

    if (highlighted >= 0)
      list[highlighted].classList.add('highlight')
  }
  
  input.addEventListener('keydown', e => {
    // console.log(e.key)
    if (e.key.indexOf('Arrow') === 0) {
      let list = document.querySelectorAll('#dropdown > ul > li');
      if (e.key === 'ArrowDown')
        handleArrowPress(list, 'down');
      else if (e.key === 'ArrowUp') {
        handleArrowPress(list, 'up');
      }
    }
    else if (e.key === 'Enter' && input.value !== '') {
      let highlight = document.querySelector('#dropdown > ul > li.highlight');
      if (highlight) {
        let cardId = findFrontCard(cards);
        let index = getIndex(cards);
        let locale = highlight.locale;
        clearUl();
        addGlobalKeydown();
        addNewlocale (locale, cardId, index);
      }
      else handleCityInput(e);
    }
    else if (e.key === 'Escape') {
      console.log('you pressed escape')
      setTimeout(()=>{
        renderBlankCard(findFrontCard(cards));
      },10)
      
      // input.blur();
      clearUl();
      addGlobalKeydown();
    }
    else if (e.key === 'Delete' || e.key === 'Backspace') {

    }
  });
});

function removeGlobalKeydown () {
  console.log('no flipping with keys!')
  window.removeEventListener('keydown', handleGlobalKeydown);
}
function addGlobalKeydown () {
  console.log('you may now flip with keys!')
  window.addEventListener('keydown', handleGlobalKeydown);
}

async function handleCityInput (e) {
  if (e.target.value === '') return;
  var card = findFrontCard(cards);
  // e.target.disabled = true;
  var index = getIndex(cards);
  let resp = await forwardLookup(e.target.value);
  handleForwardLookup(card, resp, index);
}

// select from dropdown
var dropdown = document.querySelector('#dropdown');
dropdown.addEventListener('click', (e) => {
  e.target.classList.add('highlight');
  clearUl();
  var cardId = findFrontCard(cards);
  var index = getIndex(cards);
  addNewlocale (e.target.locale, cardId, index);
})


// Keypress events: flip cards & delete card
window.addEventListener('keydown', handleGlobalKeydown);
function handleGlobalKeydown(e) {
  if (myLocales.length === 0) return;
  if (e.key === 'ArrowLeft') { // 'left arrow'
    removeAnimations();
    removeresizing();
    cards = rotateRight(cards);
    cardAnimation(cards);
    updateFrontCard(cards);
    renderBreadcrumbs(cards);
  }
  else if (e.key === 'ArrowRight') { // 'right arrow'
    removeAnimations();
    removeresizing();
    cards = rotateLeft(cards);
    cardAnimation(cards);
    updateFrontCard(cards);
    renderBreadcrumbs(cards);
  }
  else if (e.key === 'Backspace' || e.key === 'Delete') { // 'delete'
    var index = getIndex(cards);
    if (index >= myLocales.length)
      console.log('cannot delete this card')
    else {
      console.log('delete card');
      removeAnimations();
      removeresizing();
      animateDelete(findFrontCard(cards));
      //this prevents re-rendering card data till card is off screen
      setTimeout( () => {
        deleteCard(myLocales, index);
        cardAnimation(cards);
        updateFrontCard(cards);
        removeCrumb();
        renderBreadcrumbs(cards)
      },400);
    }
  }
}
// Swiping Left/Right/Up
document.addEventListener("touchstart", function handleGlobalTouch(e) {
  if (myLocales.length === 0) return;
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
      clearUl();
      removeAnimations();
      removeresizing();
      cards = rotateRight(cards);
      cardAnimation(cards);
      updateFrontCard(cards);
      renderBreadcrumbs(cards);
      document.removeEventListener("touchmove", onTouchMove)
    } else if (xVelocity < -.5) {
      removeAnimations();
      removeresizing();
      cards = rotateLeft(cards);
      cardAnimation(cards);
      updateFrontCard(cards);
      renderBreadcrumbs(cards);
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
    if (yVelocity < -1) {
      var index = getIndex(cards);
      if (index >= myLocales.length)
        console.log('cannot delete this card')
      else {
        console.log('delete card');
        removeAnimations();
        removeresizing();
        animateDelete(findFrontCard(cards));
        //this prevents re-rendering card data till card is off screen
        setTimeout( () => {
          deleteCard(myLocales, index);
          cardAnimation(cards);
          updateFrontCard(cards);
          removeCrumb();
          renderBreadcrumbs(cards);
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
function addResizing() {
  if (!document.documentElement.classList.contains('resizing'))
    document.documentElement.classList.add('resizing');
}

function removeresizing() {
  if (document.documentElement.classList.contains('resizing'))
    document.documentElement.classList.remove('resizing');
}

/* Breadcrumbs/Scrollbar functionality */
function renderBreadcrumbs(cards){
  var crumbs = document.querySelectorAll("#card-scroll > div");
  crumbs.forEach(crumb => crumb.classList.remove("selected"));

  var selected = getIndex(cards);
  crumbs[selected].classList.add("selected");
}

function addCrumb() {
  var container = document.querySelector("#card-scroll");
  var crumb = document.createElement('div');
  container.appendChild(crumb);
}

function removeCrumb() {
  var firstCrumb = document.querySelector("#card-scroll > div");
  firstCrumb.remove();
}