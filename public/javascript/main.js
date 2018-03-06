/** Global State **************************************************************/
var prodUrl = 'https://devins-weather-app.herokuapp.com/';
var devUrl = 'http://localhost:5000/';
var appUrl = prodUrl;

var touchStart;
var currentLocation = null;  // current location
var myLocals = [];        // array of saved locations
var weather = [];         // array of weather corresponding to myLocals
var sliderPos = [];       // array of slider positions, 0-24
var cards = {             // position of 3 weather cards in DOM
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
  myLocals[index] = current;
  saveToLocalStorage(myLocals);
}

function saveToLocalStorage(item) {
  localStorage.setItem('myLocals', JSON.stringify(item))
}

function loadLocalStorage(item) {
  if (item in localStorage)
    return JSON.parse(localStorage.getItem(item));
  else
    return [];
}

function deleteCard(myLocals, index) {
  myLocals.splice(index, 1);
  weather.splice(index, 1);
  sliderPos.splice(index, 1);
  saveToLocalStorage(myLocals);
}

/** Program Flow **************************************************************/
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

/* SECOND: Are there any saved locations??? */
myLocals = loadLocalStorage('myLocals');
if (myLocals.length > 0) {
  fetchFirstWeather();
  fetchRemainingWeather(myLocals);
}
else {
  console.log('no locations in storage, getting location now...');
  if (!currentLocation) {
    document.addEventListener('currentLocationUpdated', function namedFunc(){
      saveLocation(0, currentLocation);
      fetchFirstWeather();
      document.removeEventListener('currentLocationUpdated', namedFunc);
    });
  }
  else {
    saveLocation(0, currentLocation);
    fetchFirstWeather();
  }
}

function fetchFirstWeather() {
  getWeather(myLocals[0])
    .then(w => {
      weather[0] = w;
      sliderPos[0] = '0';
      renderWeather('a', 0);
    });
}

async function fetchRemainingWeather(myLocals) {
  myLocals.forEach((myLocal, index) => {
    getWeather(myLocal)
    .then((data)=>{
      if (index > 0) {
        weather[index] = data;
        sliderPos[index] = '0';
      }
    })
  })
}

/** REST API calls ************************************************************/
function getCurrentPosition() {
  console.warn('Location may be innacurate if on mobile network');
  fetch('https://freegeoip.net/json/?callback=')
  .then(resp => {
    return resp.json();
  }).then(json => {
    currentLocation = {
      lat: json.latitude,
      long: json.longitude,
      city: json.city,
      state: json.region_code
    }
    document.dispatchEvent(currentLocationUpdated);
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
  });
}

async function getCurrentPositionCallback(pos) {
  getCity(pos.coords.latitude, pos.coords.longitude)
  .then(data=>{
    currentLocation = {
      lat: pos.coords.latitude,
      long: pos.coords.longitude,
      city: data.address.city,
      state: data.address.state
    }
    document.dispatchEvent(currentLocationUpdated);
  }).catch(err => {
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

function handleForwardLookup(card, resp) {
  var index = getIndex(cards);
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
    getWeather(myLocals[index])
      .then((w)=>{
        weather[index] = w;
        sliderPos[index] = "0";
        renderWeather(frontCardId, index)
      });
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
  card.querySelector('.city').value = '';
  card.querySelector('.city').style.pointerEvents = 'none';
  card.querySelector('.city').style.cursor = 'text';
  card.querySelector('.todays-forecast .forecast').innerText = 'Getting weather...';
  card.querySelector('.week-forecast .forecast').innerText = 'Getting weather...';
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
function renderWeather(cardId, index) {
  var card = document.getElementById(cardId);
  card.querySelector('.city').value = myLocals[index].city;
  card.querySelector('.city').classList.add('filled');
  card.querySelector('.city').disabled = true;
  card.querySelector('.todays-forecast .forecast').innerText = weather[index].hourly.summary;
  card.querySelector('.week-forecast .forecast').innerText = weather[index].daily.summary;
  renderHourly(card, index, sliderPos[index]);
  renderWeekly(card, index);
}
function renderHourly(card, index, h) {
  card.querySelector('.summary .day').innerText = getShortDay(weather[index].hourly.data[h].time*1000);
  card.querySelector('.summary .time').innerText = getHour(weather[index].hourly.data[h].time*1000);
  card.querySelector('.summary .weather-summary').innerText = weather[index].hourly.data[h].summary;
  card.querySelector('.todays-forecast .weather-icon').className = `weather-icon ${weather[index].hourly.data[h].icon}`;
  card.querySelector('.todays-forecast .temp').innerText = Math.round(weather[index].hourly.data[h].temperature);
  card.querySelector('.todays-forecast .precip').innerText = Math.round(weather[index].hourly.data[h].precipProbability * 100);
  card.querySelector('.todays-forecast .humidity').innerText = Math.round(weather[index].hourly.data[h].humidity * 100);
  card.querySelector('.todays-forecast .windSpeed').innerText = Math.round(weather[index].hourly.data[h].windSpeed);
  card.querySelector('.slider').value = h;
}
function renderWeekly(card, index) {
  var li = card.querySelectorAll('.week li');
  weather[index].daily.data.forEach((day, index)=> {
    li[index].querySelector('.day').innerText = getDay(day.time*1000);
    li[index].querySelector('.weather-icon').className = `weather-icon ${day.icon}`;
    li[index].querySelector('.temp .hi').innerText = Math.round(day.temperatureHigh);
    li[index].querySelector('.temp .lo').innerText = Math.round(day.temperatureLow);
  })
}

/** Event Listeners ***********************************************************/
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
      console.log(cards)
      console.log(document.querySelector('#a'))
      console.log(document.querySelector('#b'))
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
    sliderPos[index] = e.target.value;
    renderHourly(card, getIndex(cards), sliderPos[index]);
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
    let resp = await forwardLookup(e.target.value);
    handleForwardLookup(card, resp);
  });
  cityInput[i].addEventListener('keypress', async e => {
    if (e.keyCode === 13) {
      if (e.target.value === '') return;
      var card = e.target.parentNode.parentNode.id;
      e.target.disabled = true;
      let resp = await forwardLookup(e.target.value);
      handleForwardLookup(card, resp);
    }
  })
}

// Swiping Left/Right
document.addEventListener("touchstart", (e)=> {
  if (!e.target.classList.contains('slider')) {
    document.addEventListener("touchmove", onTouchMove)
  }
  touchStart = {
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
  if (xVelocity >= yVelocity) {
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
        time: e.timeStamp
      }
    }
  }
  else {
    if (yVelocity > .5) {
      var index = getIndex(cards);
      if (index >= myLocals.length)
        console.log('cannot delete this card')
      else {
        console.log('delete card');
        animateDelete(findFrontCard(cards));
        deleteCard(myLocals, index)
        updateFrontCard(cards);
        cardAnimation(cards);
        console.log(cards)
        console.log(document.querySelector('#a'))
        console.log(document.querySelector('#b'))
      }
    }
  }
}