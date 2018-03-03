var prodUrl = 'https://devins-weather-app.herokuapp.com/';
var devUrl = 'http://localhost:5000/';
var appUrl = devUrl;

var currentLocation ={};  // current location
var myLocals = [];        // array of saved locations
var weather = [];         // array of weather corresponding to myLocals
var cards = {             // position of 3 weather cards in DOM
  a: {
    rotation: 0,
    position: 0 //'front'
  },
  b: {
    rotation: 180,
    position: 1 //'right'
  },
  c: {
    rotation: -180,
    position: 2 //'left'
  }
}

if ("geolocation" in navigator) {
  /* geolocation is available */
  console.log('location available');
  navigator.geolocation.getCurrentPosition(success);
} else {
  /* geolocation IS NOT available */
  console.log('location not available')
}
function success(pos) {
  currentLocation.lat = pos.coords.latitude;
  currentLocation.long = pos.coords.longitude;
  console.log(getCity(pos.coords.latitude, pos.coords.longitude))
}

async function getCity(lat, long){
  var path = 'location/'
  var url = appUrl + path + lat + ',' + long;

  resp = await fetch(url);
  json = await resp.json();
  console.log(json);
  return json;
}

function getWeather(myLocal, index){
  console.log(myLocal)
  var path = 'weather/'
  var url = appUrl + path + myLocal.lat + ',' + myLocal.long;

  // for testing only
  // weather[index] = testJson;
  // renderWeather(index);
  fetch(url)
  .then(resp => {
    return resp.json();
  }).then(json => {
    console.log (json)
    weather[index] = json;
    renderWeather(index);
  }).catch(err => {
    console.error(err);
  });
}

function getLocal(){
  var url = 'https://freegeoip.net/json/?callback=';
  
  fetch(url)
  .then(resp => {
    return resp.json();
  }).then(json => {
    console.log(json);
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
    myLocals = JSON.parse(localStorage.getItem("myLocal"));
  });
}

//get current location, then get current weather
fetch('https://freegeoip.net/json/?callback=')
  .then(resp => {
    return resp.json();
  }).then(json => {
    //console.log(json);
    debugger
    myLocals[0] = saveLocal(json);
    //console.log(myLocal)
    localStorage.setItem("myLocal", JSON.stringify(myLocals));
    getWeather(myLocals[0], 0);
    renderBlankCard(1);
    renderDownloadCard(2);
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
    myLocals = JSON.parse(localStorage.getItem("myLocal"));
    if (myLocals === null) {
      console.err("no location saved in storage")
    }
    else {
      console.warn("your last saved location is " + myLocals[0].city)
      getWeather(myLocals[0], 0);
      renderBlankCard(1);
      renderBlankCard(2);
    }
  });

function saveLocal(json){
  return {
    lat: json.latitude,
    long: json.longitude,
    city: json.city,
    state: json.region_code
  };
}

window.addEventListener('keydown', e => {
  if (e.keyCode === 37) { // rotate left
    console.log('rotate left')
    cards = rotateLeft(cards);
    updateCardsInDOM(cards)
  }
  else if (e.keyCode === 39) { // rotate right
    console.log('rotate right')
    cards = rotateRight(cards)
    updateCardsInDOM(cards)
  }
})

function rotateLeft (cards) {
  // console.log(cards)
  return {
    a: {
      rotation: normalizePos(cards.a.position) === 2 ? cards.a.rotation : cards.a.rotation -180,
      position: cards.a.position - 1
    },
    b: {
      rotation: normalizePos(cards.b.position) === 2 ? cards.b.rotation : cards.b.rotation -180,
      position: cards.b.position - 1
    },
    c: {
      rotation: normalizePos(cards.c.position) === 2 ? cards.c.rotation : cards.c.rotation -180,
      position: cards.c.position - 1
    }
  };
}

function rotateRight (cards) {
  // console.log(cards)
  return {
    a: {
      rotation: normalizePos(cards.a.position) === 1 ? cards.a.rotation : cards.a.rotation +180,
      position: cards.a.position + 1
    },
    b: {
      rotation: normalizePos(cards.b.position) === 1 ? cards.b.rotation : cards.b.rotation +180,
      position: cards.b.position + 1
    },
    c: {
      rotation: normalizePos(cards.c.position)=== 1 ? cards.c.rotation : cards.c.rotation +180,
      position: cards.c.position + 1
    }
  };
}

function updateCardsInDOM (c) {
  var card;
  for (let key in c) {
    // console.log(key)
    card = document.querySelector(`#${key}`);
    card.classList.remove('left', 'right', 'front');
    card.classList.add(`${numToPos(c[key].position)}`);
    console.log(c[key].rotation)
    card.style.transform = `rotateY(${c[key].rotation}deg)`;
  }
}

function normalizePos(num) {
  var mod = num%3;
  if (mod < 0) {
    while (mod <0){
      mod = mod+3
    }
  }
  return mod;
}

function numToPos (num) {
  var pos;
  switch (normalizePos(num)) {
    case 0: 
      pos = 'front';
      break;
    case 1:
      pos = 'right';
      break;
    case 2:
      pos = 'left';
      break;
  }
  return pos;
}
function renderBlankCard(index) {
  var cardId = indexToCard(index);
  var card = document.getElementById(cardId);
  card.querySelector('.city').value = '';
  card.querySelector('.city').placeholder = 'Enter Location';
  card.querySelector('.city').classList.remove('filled');
  card.querySelector('.todays-forecast .forecast').innerText = '';
  card.querySelector('.week-forecast .forecast').innerText = '';
  renderHourlyBlank(card);//TODO
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

function renderDownloadCard(index) {
  var cardId = indexToCard(index);
  var card = document.getElementById(cardId);
  card.querySelector('.city').value = '';
  card.querySelector('.city').style.pointerEvents = 'none';
  card.querySelector('.city').style.cursor = 'text';
  card.querySelector('.todays-forecast .forecast').innerText = 'Getting weather...';
  card.querySelector('.week-forecast .forecast').innerText = 'Getting weather...';
  renderHourlyDownload(card);//TODO
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

function renderWeather(index) {
  debugger
  var cardId = indexToCard(index);
  var card = document.getElementById(cardId);
  card.querySelector('.city').value = myLocals[index].city;
  card.querySelector('.todays-forecast .forecast').innerText = weather[index].hourly.summary;
  card.querySelector('.week-forecast .forecast').innerText = weather[index].daily.summary;
  renderHourly(card, index, 0);//TODO
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

function indexToCard(index) {
  var pos = normalizePos(index);
  var card;
  switch (pos) {
    case 0:
      card = 'a';
    break;
      case 1:
      card = 'b';
      break;
    case 2:
      card = 'c';
      break;
  }
  return card
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

document.querySelector('.slider').addEventListener('input', (e) => {
  console.log(e)
  var card = e.target.parentNode.parentNode
  var h = e.target.value
  renderHourly(card, 0, h)
})

document.addEventListener("touchstart", (e)=> {
  if (!e.target.classList.contains('slider')) {
    document.addEventListener("touchmove", onTouchMove)
  }
  console.log(e)
  touchStart = {
    x: e.changedTouches[0].clientX,
    time: e.timeStamp
  }
})

function onTouchMove (e) {
  var x = e.changedTouches[0].clientX;
  var time = e.timeStamp;
  var velocity = (x-touchStart.x)/(time-touchStart.time);
  console.log(velocity)
  if (velocity > .5) {
    cards = rotateRight(cards);
    updateCardsInDOM(cards);
    document.removeEventListener("touchmove", onTouchMove)
  } else if (velocity < -.5) {
    cards = rotateLeft(cards);
    updateCardsInDOM(cards)
    document.removeEventListener("touchmove", onTouchMove)
  } else {
    touchStart = {
      x: e.changedTouches[0].clientX,
      time: e.timeStamp
    }
  }
}

var touchStart;

var testJson = {
  "latitude": 40.6583,
  "longitude":-111.9231,
  "timezone":"America/Denver",
  "currently": {"time":1519418333,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","nearestStormDistance":3,"nearestStormBearing":71,"precipIntensity":0,"precipProbability":0,"temperature":24.63,"apparentTemperature":15.3,"dewPoint":21.12,"humidity":0.86,"pressure":1020.09,"windSpeed":8.85,"windGust":14.36,"windBearing":322,"cloudCover":0.78,"uvIndex":2,"visibility":4.21,"ozone":442.87},"minutely":{"summary":"Mostly cloudy for the hour.","icon":"partly-cloudy-day","data":[{"time":1519418280,"precipIntensity":0,"precipProbability":0},
  {"time":1519418340,"precipIntensity":0,"precipProbability":0},{"time":1519418400,"precipIntensity":0,"precipProbability":0},{"time":1519418460,"precipIntensity":0,"precipProbability":0},{"time":1519418520,"precipIntensity":0,"precipProbability":0},{"time":1519418580,"precipIntensity":0,"precipProbability":0},{"time":1519418640,"precipIntensity":0,"precipProbability":0},{"time":1519418700,"precipIntensity":0,"precipProbability":0},{"time":1519418760,"precipIntensity":0,"precipProbability":0},{"time":1519418820,"precipIntensity":0,"precipProbability":0},{"time":1519418880,"precipIntensity":0,"precipProbability":0},{"time":1519418940,"precipIntensity":0,"precipProbability":0},{"time":1519419000,"precipIntensity":0,"precipProbability":0},{"time":1519419060,"precipIntensity":0,"precipProbability":0},{"time":1519419120,"precipIntensity":0,"precipProbability":0},{"time":1519419180,"precipIntensity":0,"precipProbability":0},{"time":1519419240,"precipIntensity":0,"precipProbability":0},{"time":1519419300,"precipIntensity":0,"precipProbability":0},{"time":1519419360,"precipIntensity":0,"precipProbability":0},{"time":1519419420,"precipIntensity":0,"precipProbability":0},{"time":1519419480,"precipIntensity":0,"precipProbability":0},{"time":1519419540,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.01,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519419600,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.01,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519419660,"precipIntensity":0,"precipProbability":0},{"time":1519419720,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.01,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519419780,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.01,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519419840,"precipIntensity":0.002,"precipIntensityError":0.001,"precipProbability":0.01,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519419900,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.02,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519419960,"precipIntensity":0,"precipProbability":0},{"time":1519420020,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.02,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519420080,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.02,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519420140,"precipIntensity":0.002,"precipIntensityError":0,"precipProbability":0.03,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519420200,"precipIntensity":0.002,"precipIntensityError":0.001,"precipProbability":0.03,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519420260,"precipIntensity":0.002,"precipIntensityError":0.001,"precipProbability":0.04,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519420320,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.04,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420380,"precipIntensity":0.002,"precipIntensityError":0.001,"precipProbability":0.05,"precipAccumulation":0.024,"precipType":"snow"},{"time":1519420440,"precipIntensity":0.002,"precipIntensityError":0.001,"precipProbability":0.05,"precipAccumulation":0.024,"precipType":"snow"},
  {"time":1519420500,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.06,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420560,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.06,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420620,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.06,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420680,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.06,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420740,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.07,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420800,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.07,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420860,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.09,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420920,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.08,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519420980,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.09,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421040,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.1,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421100,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.1,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421160,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.1,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421220,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.11,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421280,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.12,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421340,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.12,"precipAccumulation":0.037,"precipType":"snow"},{"time":1519421400,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.13,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421460,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.14,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421520,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.14,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421580,"precipIntensity":0.003,"precipIntensityError":0.002,"precipProbability":0.14,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421640,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.15,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421700,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.16,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421760,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.16,"precipAccumulation":0.034,"precipType":"snow"},
  {"time":1519421820,"precipIntensity":0.003,"precipIntensityError":0.001,"precipProbability":0.16,"precipAccumulation":0.034,"precipType":"snow"},{"time":1519421880,"precipIntensity":0.003,"precipIntensityError":0.002,"precipProbability":0.17,"precipAccumulation":0.034,"precipType":"snow"}]},"hourly":{"summary":"Mostly cloudy throughout the day.","icon":"partly-cloudy-night","data":[{"time":1519416000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0002,"precipProbability":0.08,"precipAccumulation":0,"precipType":"snow","temperature":24.31,"apparentTemperature":15.18,"dewPoint":21.69,"humidity":0.9,"pressure":1019.76,"windSpeed":8.44,"windGust":14.14,"windBearing":321,"cloudCover":0.76,"uvIndex":2,"visibility":3.62,"ozone":442.79},{"time":1519419600,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0008,"precipProbability":0.05,"precipAccumulation":0.01,"precipType":"snow","temperature":24.8,"apparentTemperature":15.37,"dewPoint":20.8,"humidity":0.84,"pressure":1020.27,"windSpeed":9.07,"windGust":14.48,"windBearing":322,"cloudCover":0.79,"uvIndex":2,"visibility":4.52,"ozone":442.92},{"time":1519423200,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0021,"precipProbability":0.06,"precipAccumulation":0.023,"precipType":"snow","temperature":26.35,"apparentTemperature":17.01,"dewPoint":19.57,"humidity":0.75,"pressure":1021.46,"windSpeed":9.51,"windGust":14.65,"windBearing":318,"cloudCover":0.82,"uvIndex":1,"visibility":5.03,"ozone":442.75},{"time":1519426800,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0062,"precipProbability":0.07,"precipAccumulation":0.062,"precipType":"snow","temperature":28,"apparentTemperature":18.82,"dewPoint":18.2,"humidity":0.66,"pressure":1022.64,"windSpeed":9.9,"windGust":14.57,"windBearing":314,"cloudCover":0.82,"uvIndex":1,"visibility":5.77,"ozone":442.23},{"time":1519430400,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0047,"precipProbability":0.06,"precipAccumulation":0.046,"precipType":"snow","temperature":28.48,"apparentTemperature":20.5,"dewPoint":16.55,"humidity":0.6,"pressure":1023.84,"windSpeed":8.09,"windGust":13.46,"windBearing":314,"cloudCover":0.72,"uvIndex":0,"visibility":6.01,"ozone":442.41},{"time":1519434000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0033,"precipProbability":0.04,"precipAccumulation":0.034,"precipType":"snow","temperature":27.62,"apparentTemperature":19.4,"dewPoint":15.76,"humidity":0.6,"pressure":1024.25,"windSpeed":8.16,"windGust":10.88,"windBearing":325,"cloudCover":0.64,"uvIndex":0,"visibility":6.32,"ozone":444.35},{"time":1519437600,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0017,"precipProbability":0.03,"precipAccumulation":0.02,"precipType":"snow","temperature":26.15,"apparentTemperature":19.58,"dewPoint":14.04,"humidity":0.6,"pressure":1025.39,"windSpeed":5.64,"windGust":8.66,"windBearing":326,"cloudCover":0.48,"uvIndex":0,"visibility":6.2,"ozone":446.87},{"time":1519441200,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0012,"precipProbability":0.03,"precipAccumulation":0.015,"precipType":"snow","temperature":24.02,"apparentTemperature":17.17,"dewPoint":11.65,"humidity":0.59,"pressure":1026.44,"windSpeed":5.53,"windGust":6.89,"windBearing":328,"cloudCover":0.38,"uvIndex":0,"visibility":6.26,"ozone":447.3},{"time":1519444800,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0005,"precipProbability":0.02,"precipAccumulation":0.007,"precipType":"snow","temperature":22.17,"apparentTemperature":15.1,"dewPoint":9.74,"humidity":0.58,"pressure":1027.8,"windSpeed":5.41,"windGust":6.71,"windBearing":326,"cloudCover":0.34,"uvIndex":0,"visibility":6.8,"ozone":444.19},{"time":1519448400,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0013,"precipProbability":0.03,"precipAccumulation":0.019,"precipType":"snow","temperature":21.13,"apparentTemperature":16.25,"dewPoint":7.98,"humidity":0.56,"pressure":1029.01,"windSpeed":3.49,"windGust":6.55,"windBearing":312,"cloudCover":0.33,"uvIndex":0,"visibility":6.97,"ozone":438.95},{"time":1519452000,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0016,"precipProbability":0.04,"precipAccumulation":0.026,"precipType":"snow","temperature":19.14,"apparentTemperature":13.22,"dewPoint":6.85,"humidity":0.58,"pressure":1030.22,"windSpeed":4,"windGust":5.83,"windBearing":311,"cloudCover":0.38,"uvIndex":0,"visibility":7.48,"ozone":433.54},{"time":1519455600,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0017,"precipProbability":0.04,"precipAccumulation":0.03,"precipType":"snow","temperature":17.53,"apparentTemperature":17.53,"dewPoint":5.97,"humidity":0.6,"pressure":1030.79,"windSpeed":2.64,"windGust":5.56,"windBearing":31,"cloudCover":0.38,"uvIndex":0,"visibility":7.29,"ozone":428.14},{"time":1519459200,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0014,"precipProbability":0.04,"precipAccumulation":0.027,"precipType":"snow","temperature":15.67,"apparentTemperature":8.96,"dewPoint":5.13,"humidity":0.62,"pressure":1030.94,"windSpeed":4.19,"windGust":6.01,
  "windBearing":103,"cloudCover":0.39,"uvIndex":0,"visibility":6.9,"ozone":422.54},{"time":1519462800,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0016,"precipProbability":0.04,"precipAccumulation":0.03,"precipType":"snow","temperature":14.56,"apparentTemperature":8.62,"dewPoint":4.91,"humidity":0.65,"pressure":1030.94,"windSpeed":3.56,"windGust":6.13,"windBearing":157,"cloudCover":0.42,"uvIndex":0,"visibility":6.6,"ozone":418.07},{"time":1519466400,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0005,"precipProbability":0.02,"precipAccumulation":0.009,"precipType":"snow","temperature":12.97,"apparentTemperature":5.65,"dewPoint":3.07,"humidity":0.64,"pressure":1031.82,"windSpeed":4.3,"windGust":5.4,"windBearing":153,"cloudCover":0.56,"uvIndex":0,"visibility":2.81,"ozone":415.62},{"time":1519470000,"summary":"Foggy","icon":"fog","precipIntensity":0.0007,"precipProbability":0.03,"precipAccumulation":0.013,"precipType":"snow","temperature":11.86,"apparentTemperature":3.63,"dewPoint":2.3,"humidity":0.65,"pressure":1031.75,"windSpeed":4.84,"windGust":6.29,"windBearing":170,"cloudCover":0.58,"uvIndex":0,"visibility":1.86,"ozone":414.45},{"time":1519473600,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0009,"precipProbability":0.03,"precipAccumulation":0.018,"precipType":"snow","temperature":11.2,"apparentTemperature":2.28,"dewPoint":1.97,"humidity":0.66,"pressure":1031.49,"windSpeed":5.3,"windGust":7.24,"windBearing":181,"cloudCover":0.6,"uvIndex":0,"visibility":2,"ozone":413.05},{"time":1519477200,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0005,"precipProbability":0.02,"precipAccumulation":0.01,"precipType":"snow","temperature":10.56,"apparentTemperature":1.15,"dewPoint":1.9,"humidity":0.67,"pressure":1031.25,"windSpeed":5.61,"windGust":8.22,"windBearing":179,"cloudCover":0.6,"uvIndex":0,"visibility":4.42,"ozone":411.05},{"time":1519480800,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0003,"precipProbability":0.02,"precipAccumulation":0.005,"precipType":"snow","temperature":10.52,"apparentTemperature":0.78,"dewPoint":2.29,"humidity":0.69,"pressure":1030.86,"windSpeed":5.89,"windGust":9.27,"windBearing":171,"cloudCover":0.59,"uvIndex":0,"visibility":7.91,"ozone":408.96},{"time":1519484400,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0003,"precipProbability":0.02,"precipAccumulation":0.005,"precipType":"snow","temperature":11.69,"apparentTemperature":1.7,"dewPoint":3.49,"humidity":0.69,"pressure":1030.11,"windSpeed":6.32,"windGust":10.31,"windBearing":167,"cloudCover":0.6,"uvIndex":0,"visibility":9.99,"ozone":407.13},{"time":1519488000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0004,"precipProbability":0.02,"precipAccumulation":0.007,"precipType":"snow","temperature":15.45,"apparentTemperature":5.55,"dewPoint":5.84,"humidity":0.65,"pressure":1028.9,"windSpeed":7.01,"windGust":11.37,"windBearing":170,"cloudCover":0.66,"uvIndex":1,"visibility":9.17,"ozone":405.79},{"time":1519491600,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0007,"precipProbability":0.02,"precipAccumulation":0.01,"precipType":"snow","temperature":20.03,"apparentTemperature":10.42,"dewPoint":9.03,"humidity":0.62,"pressure":1027.34,"windSpeed":7.81,"windGust":12.34,"windBearing":177,"cloudCover":0.74,"uvIndex":1,"visibility":6.93,"ozone":404.72},{"time":1519495200,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0012,"precipProbability":0.02,"precipAccumulation":0.015,"precipType":"snow","temperature":23.6,"apparentTemperature":14.29,"dewPoint":11.6,"humidity":0.59,"pressure":1025.74,"windSpeed":8.48,"windGust":13.16,"windBearing":184,"cloudCover":0.8,"uvIndex":2,"visibility":5.17,"ozone":403.55},{"time":1519498800,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0018,"precipProbability":0.03,"precipAccumulation":0.021,"precipType":"snow","temperature":25.31,"apparentTemperature":16.05,"dewPoint":12.98,"humidity":0.59,"pressure":1024.07,"windSpeed":8.97,"windGust":13.85,"windBearing":189,"cloudCover":0.82,"uvIndex":2,"visibility":4.84,"ozone":401.92},{"time":1519502400,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0031,"precipProbability":0.05,"precipAccumulation":0.035,"precipType":"snow","temperature":26.29,
  "apparentTemperature":16.97,"dewPoint":13.77,"humidity":0.59,"pressure":1022.32,"windSpeed":9.44,"windGust":14.47,"windBearing":192,"cloudCover":0.85,"uvIndex":2,"visibility":4.98,"ozone":400.12},{"time":1519506000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0053,"precipProbability":0.06,"precipAccumulation":0.057,"precipType":"snow","temperature":27.02,"apparentTemperature":17.7,"dewPoint":14.52,"humidity":0.59,"pressure":1020.84,"windSpeed":9.74,"windGust":14.98,"windBearing":195,"cloudCover":0.88,"uvIndex":2,"visibility":4.71,"ozone":398.1},{"time":1519509600,"summary":"Possible Light Snow","icon":"snow","precipIntensity":0.0077,"precipProbability":0.09,"precipAccumulation":0.08,"precipType":"snow","temperature":27.61,"apparentTemperature":18.57,"dewPoint":15.31,"humidity":0.59,"pressure":1019.63,"windSpeed":9.49,"windGust":15.42,"windBearing":195,"cloudCover":0.88,"uvIndex":1,"visibility":3.44,"ozone":395.92},{"time":1519513200,"summary":"Possible Light Snow","icon":"snow","precipIntensity":0.011,"precipProbability":0.11,"precipAccumulation":0.113,"precipType":"snow","temperature":27.77,"apparentTemperature":19.02,"dewPoint":16.07,"humidity":0.61,"pressure":1018.64,"windSpeed":9.06,"windGust":15.76,"windBearing":194,"cloudCover":0.9,"uvIndex":1,"visibility":1.75,"ozone":393.55},{"time":1519516800,"summary":"Snow","icon":"snow","precipIntensity":0.0152,"precipProbability":0.14,"precipAccumulation":0.156,"precipType":"snow","temperature":27.77,"apparentTemperature":19.19,"dewPoint":16.7,"humidity":0.63,"pressure":1018.02,"windSpeed":8.78,"windGust":15.81,"windBearing":189,"cloudCover":0.92,"uvIndex":0,"visibility":0.48,"ozone":390.97},{"time":1519520400,"summary":"Snow","icon":"snow","precipIntensity":0.0214,"precipProbability":0.17,"precipAccumulation":0.225,"precipType":"snow","temperature":27.41,"apparentTemperature":19.1,"dewPoint":17.01,"humidity":0.64,"pressure":1017.95,"windSpeed":8.24,"windGust":15,"windBearing":183,"cloudCover":0.94,"uvIndex":0,"visibility":0.07,"ozone":387.86},{"time":1519524000,"summary":"Snow","icon":"snow","precipIntensity":0.0301,"precipProbability":0.2,"precipAccumulation":0.324,"precipType":"snow","temperature":26.97,"apparentTemperature":18.63,"dewPoint":17.14,"humidity":0.66,"pressure":1018.24,"windSpeed":8.12,"windGust":13.94,"windBearing":193,"cloudCover":0.98,"uvIndex":0,"visibility":0.01,"ozone":384.54},{"time":1519527600,"summary":"Snow","icon":"snow","precipIntensity":0.0361,"precipProbability":0.22,"precipAccumulation":0.397,"precipType":"snow","temperature":26.65,"apparentTemperature":18.02,"dewPoint":17.12,"humidity":0.67,"pressure":1018.71,"windSpeed":8.47,"windGust":14.33,"windBearing":190,"cloudCover":1,"uvIndex":0,"visibility":0.07,"ozone":382.23},{"time":1519531200,"summary":"Snow","icon":"snow","precipIntensity":0.0329,"precipProbability":0.2,"precipAccumulation":0.358,"precipType":"snow","temperature":26.83,"apparentTemperature":17.91,"dewPoint":16.84,"humidity":0.66,"pressure":1019.4,"windSpeed":8.99,"windGust":17.92,"windBearing":152,"cloudCover":0.98,"uvIndex":0,"visibility":2.33,"ozone":382.29},{"time":1519534800,"summary":"Snow","icon":"snow","precipIntensity":0.0284,"precipProbability":0.19,"precipAccumulation":0.304,"precipType":"snow","temperature":27.07,"apparentTemperature":17.67,"dewPoint":16.44,"humidity":0.64,"pressure":1020.26,"windSpeed":9.92,"windGust":22.84,"windBearing":316,"cloudCover":0.96,"uvIndex":0,"visibility":5.46,"ozone":383.31},{"time":1519538400,"summary":"Snow","icon":"snow","precipIntensity":0.0248,"precipProbability":0.17,"precipAccumulation":0.273,"precipType":"snow","temperature":26.63,"apparentTemperature":15.74,"dewPoint":15.91,"humidity":0.63,"pressure":1021.27,"windSpeed":12.61,"windGust":25.58,"windBearing":265,"cloudCover":0.93,"uvIndex":0,"visibility":7.38,"ozone":382.44},{"time":1519542000,"summary":"Snow","icon":"snow","precipIntensity":0.0192,"precipProbability":0.14,"precipAccumulation":0.227,"precipType":"snow","temperature":25.44,"apparentTemperature":15.47,"dewPoint":15.1,"humidity":0.64,"pressure":1022.55,"windSpeed":10.21,"windGust":24.42,"windBearing":240,"cloudCover":0.92,"uvIndex":0,"visibility":6.68,"ozone":377.34},{"time":1519545600,"summary":"Snow","icon":"snow","precipIntensity":0.0131,"precipProbability":0.11,"precipAccumulation":0.168,"precipType":"snow","temperature":23.93,"apparentTemperature":13.34,"dewPoint":14.1,"humidity":0.66,"pressure":1023.97,"windSpeed":10.67,"windGust":21.22,"windBearing":294,"cloudCover":0.91,"uvIndex":0,"visibility":4.77,"ozone":370.36},{"time":1519549200,"summary":"Possible Light Snow","icon":"snow","precipIntensity":0.0095,"precipProbability":0.09,"precipAccumulation":0.129,"precipType":"snow","temperature":22.88,"apparentTemperature":12.49,"dewPoint":13.2,"humidity":0.66,"pressure":1025.15,"windSpeed":9.89,"windGust":18.24,"windBearing":285,"cloudCover":0.9,"uvIndex":0,"visibility":3.83,"ozone":365.84},{"time":1519552800,"summary":"Possible Light Snow","icon":"snow","precipIntensity":0.0079,"precipProbability":0.08,"precipAccumulation":0.109,"precipType":"snow","temperature":22.55,"apparentTemperature":13.23,"dewPoint":12.45,"humidity":0.65,"pressure":1025.81,"windSpeed":8.15,"windGust":16.28,"windBearing":346,"cloudCover":0.88,"uvIndex":0,"visibility":5.13,"ozone":366.44},{"time":1519556400,"summary":"Possible Light Snow","icon":"snow","precipIntensity":0.0074,"precipProbability":0.08,"precipAccumulation":0.103,"precipType":"snow","temperature":22.49,"apparentTemperature":13.36,"dewPoint":11.8,"humidity":0.63,"pressure":1026.26,"windSpeed":7.88,"windGust":14.54,"windBearing":198,"cloudCover":0.86,"uvIndex":0,"visibility":7.39,"ozone":369.53},{"time":1519560000,"summary":"Possible Light Snow","icon":"snow","precipIntensity":0.0068,"precipProbability":0.07,"precipAccumulation":0.094,"precipType":"snow","temperature":22.39,"apparentTemperature":13.3,"dewPoint":11.19,"humidity":0.62,"pressure":1026.8,"windSpeed":7.79,"windGust":12.94,"windBearing":264,"cloudCover":0.82,"uvIndex":0,"visibility":8.93,"ozone":371.03},{"time":1519563600,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0049,"precipProbability":0.06,"precipAccumulation":0.071,"precipType":"snow","temperature":21.62,"apparentTemperature":12.9,"dewPoint":10.38,"humidity":0.61,"pressure":1027.78,"windSpeed":7.11,"windGust":11.25,"windBearing":280,"cloudCover":0.72,"uvIndex":0,"visibility":8.8,"ozone":368.92},{"time":1519567200,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.003,"precipProbability":0.05,"precipAccumulation":0.046,"precipType":"snow","temperature":20.41,"apparentTemperature":11.95,"dewPoint":9.63,"humidity":0.62,"pressure":1028.84,"windSpeed":6.53,"windGust":9.73,"windBearing":215,"cloudCover":0.61,"uvIndex":0,"visibility":7.93,"ozone":365.18},{"time":1519570800,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.002,"precipProbability":0.04,"precipAccumulation":0.03,"precipType":"snow","temperature":20.11,"apparentTemperature":11.56,"dewPoint":9.67,"humidity":0.63,"pressure":1029.34,"windSpeed":6.56,"windGust":8.95,"windBearing":209,"cloudCover":0.53,"uvIndex":0,"visibility":7.43,"ozone":362.24},{"time":1519574400,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0016,"precipProbability":0.03,"precipAccumulation":0.023,"precipType":"snow","temperature":22.13,"apparentTemperature":13.55,"dewPoint":11.09,"humidity":0.62,"pressure":1028.99,"windSpeed":7.07,"windGust":9.42,"windBearing":209,"cloudCover":0.55,"uvIndex":1,"visibility":8.05,"ozone":361.23},{"time":1519578000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0017,"precipProbability":0.03,"precipAccumulation":0.02,"precipType":"snow","temperature":25.38,"apparentTemperature":16.75,"dewPoint":13.35,"humidity":0.6,"pressure":1028.06,"windSpeed":8.04,"windGust":10.6,"windBearing":208,"cloudCover":0.6,"uvIndex":1,"visibility":9.04,"ozone":361},{"time":1519581600,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0018,"precipProbability":0.03,"precipAccumulation":0.018,"precipType":"snow","temperature":28.35,"apparentTemperature":19.82,"dewPoint":15.26,"humidity":0.57,"pressure":1026.99,"windSpeed":8.93,"windGust":11.7,"windBearing":205,"cloudCover":0.63,"uvIndex":2,"visibility":9.29,"ozone":360.51},{"time":1519585200,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0018,"precipProbability":0.03,"precipAccumulation":0.016,"precipType":"snow","temperature":30.21,"apparentTemperature":21.81,"dewPoint":16.46,"humidity":0.56,"pressure":1025.82,"windSpeed":9.44,"windGust":12.3,"windBearing":203,"cloudCover":0.62,"uvIndex":3,"visibility":7.84,"ozone":359.14},{"time":1519588800,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0.0022,"precipProbability":0.05,"precipAccumulation":0.017,"precipType":"snow","temperature":31.9,"apparentTemperature":23.64,"dewPoint":17.38,"humidity":0.55,"pressure":1024.5,"windSpeed":9.92,"windGust":12.83,"windBearing":200,"cloudCover":0.59,"uvIndex":3,"visibility":5.66,"ozone":357.51}]},"daily":{"summary":"Snow (6–9 in.) today through Tuesday, with temperatures rising to 44°F next Friday.","icon":"snow","data":[{"time":1519369200,"summary":"Foggy in the morning.","icon":"fog","sunriseTime":1519395089,"sunsetTime":1519434804,"moonPhase":0.27,"precipIntensity":0.0013,"precipIntensityMax":0.0062,"precipIntensityMaxTime":1519426800,"precipProbability":0.43,"precipAccumulation":0.355,"precipType":"snow","temperatureHigh":28.48,"temperatureHighTime":1519430400,"temperatureLow":10.52,"temperatureLowTime":1519480800,"apparentTemperatureHigh":26.2,"apparentTemperatureHighTime":1519394400,"apparentTemperatureLow":0.78,"apparentTemperatureLowTime":1519480800,"dewPoint":19.1,"humidity":0.78,"pressure":1020.37,"windSpeed":4.9,"windGust":15.01,"windGustTime":1519412400,"windBearing":323,"cloudCover":0.66,"uvIndex":2,"uvIndexTime":1519412400,"visibility":5.77,"ozone":433.3,"temperatureMin":19.14,"temperatureMinTime":1519452000,"temperatureMax":28.48,"temperatureMaxTime":1519430400,"apparentTemperatureMin":13.22,"apparentTemperatureMinTime":1519452000,"apparentTemperatureMax":26.78,"apparentTemperatureMaxTime":1519369200},{"time":1519455600,"summary":"Snow (2–4 in.) starting in the afternoon.","icon":"snow","sunriseTime":1519481402,"sunsetTime":1519521274,"moonPhase":0.31,"precipIntensity":0.0095,"precipIntensityMax":0.0361,"precipIntensityMaxTime":1519527600,"precipProbability":0.38,"precipAccumulation":2.524,"precipType":"snow","temperatureHigh":27.77,"temperatureHighTime":1519516800,"temperatureLow":20.11,"temperatureLowTime":1519570800,"apparentTemperatureHigh":19.19,"apparentTemperatureHighTime":1519516800,"apparentTemperatureLow":11.56,"apparentTemperatureLowTime":1519570800,"dewPoint":10.3,"humidity":0.63,"pressure":1025.05,"windSpeed":5.77,"windGust":25.58,"windGustTime":1519538400,"windBearing":187,"cloudCover":0.75,"uvIndex":2,"uvIndexTime":1519495200,"visibility":4.44,"ozone":401.51,"temperatureMin":10.52,"temperatureMinTime":1519480800,"temperatureMax":27.77,"temperatureMaxTime":1519516800,"apparentTemperatureMin":0.78,"apparentTemperatureMinTime":1519480800,"apparentTemperatureMax":19.19,"apparentTemperatureMaxTime":1519516800},{"time":1519542000,"summary":"Light snow (< 1 in.) in the morning and overnight.","icon":"snow","sunriseTime":1519567713,"sunsetTime":1519607743,"moonPhase":0.35,"precipIntensity":0.0048,"precipIntensityMax":0.0192,"precipIntensityMaxTime":1519542000,"precipProbability":0.36,"precipAccumulation":1.351,"precipType":"snow","temperatureHigh":34.3,"temperatureHighTime":1519599600,"temperatureLow":27.48,"temperatureLowTime":1519653600,"apparentTemperatureHigh":26.17,"apparentTemperatureHighTime":1519599600,"apparentTemperatureLow":18.86,"apparentTemperatureLowTime":1519657200,"dewPoint":14.95,"humidity":0.59,"pressure":1024.36,"windSpeed":7.28,"windGust":24.42,"windGustTime":1519542000,"windBearing":204,"cloudCover":0.72,"uvIndex":3,"uvIndexTime":1519585200,"visibility":7.47,"ozone":363.74,"temperatureMin":20.11,"temperatureMinTime":1519570800,"temperatureMax":34.3,"temperatureMaxTime":1519599600,"apparentTemperatureMin":11.56,"apparentTemperatureMinTime":1519570800,"apparentTemperatureMax":26.17,"apparentTemperatureMaxTime":1519599600},{"time":1519628400,"summary":"Snow (1–3 in.) until afternoon.","icon":"snow","sunriseTime":1519654024,"sunsetTime":1519694212,"moonPhase":0.38,"precipIntensity":0.0136,"precipIntensityMax":0.0266,"precipIntensityMaxTime":1519657200,"precipProbability":0.51,"precipAccumulation":2.76,"precipType":"snow","temperatureHigh":36.56,"temperatureHighTime":1519682400,"temperatureLow":26.91,"temperatureLowTime":1519743600,"apparentTemperatureHigh":32.59,"apparentTemperatureHighTime":1519686000,"apparentTemperatureLow":21.98,"apparentTemperatureLowTime":1519743600,"dewPoint":20.9,"humidity":0.65,"pressure":1016.07,"windSpeed":6.31,"windGust":20.83,"windGustTime":1519632000,"windBearing":173,"cloudCover":0.97,"uvIndex":2,"uvIndexTime":1519671600,"visibility":6.02,"ozone":384.74,"temperatureMin":27.48,"temperatureMinTime":1519653600,"temperatureMax":36.56,"temperatureMaxTime":1519682400,"apparentTemperatureMin":18.86,"apparentTemperatureMinTime":1519657200,"apparentTemperatureMax":32.59,"apparentTemperatureMaxTime":1519686000},{"time":1519714800,"summary":"Mostly cloudy throughout the day.","icon":"partly-cloudy-day","sunriseTime":1519740334,"sunsetTime":1519780681,"moonPhase":0.42,"precipIntensity":0.0036,"precipIntensityMax":0.0075,"precipIntensityMaxTime":1519714800,"precipProbability":0.25,"precipAccumulation":0.84,"precipType":"snow","temperatureHigh":31.69,"temperatureHighTime":1519772400,"temperatureLow":14.44,"temperatureLowTime":1519815600,"apparentTemperatureHigh":27.13,"apparentTemperatureHighTime":1519772400,"apparentTemperatureLow":7.09,
  "apparentTemperatureLowTime":1519826400,"dewPoint":16.54,"humidity":0.63,"pressure":1021.02,"windSpeed":2.84,"windGust":8.91,"windGustTime":1519754400,"windBearing":301,"cloudCover":0.74,"uvIndex":2,"uvIndexTime":1519754400,"ozone":401.8,"temperatureMin":18.73,"temperatureMinTime":1519797600,"temperatureMax":31.69,"temperatureMaxTime":1519772400,"apparentTemperatureMin":18.73,"apparentTemperatureMinTime":1519797600,"apparentTemperatureMax":29.23,"apparentTemperatureMaxTime":1519714800},{"time":1519801200,"summary":"Mostly cloudy throughout the day.","icon":"partly-cloudy-day","sunriseTime":1519826643,"sunsetTime":1519867149,"moonPhase":0.46,"precipIntensity":0.0035,"precipIntensityMax":0.0076,"precipIntensityMaxTime":1519840800,"precipProbability":0.16,"precipAccumulation":1.032,"precipType":"snow","temperatureHigh":31.84,"temperatureHighTime":1519858800,"temperatureLow":13.93,"temperatureLowTime":1519912800,"apparentTemperatureHigh":26.36,"apparentTemperatureHighTime":1519862400,"apparentTemperatureLow":5.21,"apparentTemperatureLowTime":1519912800,"dewPoint":11.04,"humidity":0.62,"pressure":1026.15,"windSpeed":1.42,"windGust":15.14,"windGustTime":1519855200,"windBearing":195,"cloudCover":0.84,"uvIndex":2,"uvIndexTime":1519840800,"ozone":400.76,"temperatureMin":14.44,"temperatureMinTime":1519815600,"temperatureMax":31.84,"temperatureMaxTime":1519858800,"apparentTemperatureMin":7.09,"apparentTemperatureMinTime":1519826400,"apparentTemperatureMax":26.36,"apparentTemperatureMaxTime":1519862400},{"time":1519887600,"summary":"Partly cloudy until evening.","icon":"partly-cloudy-day","sunriseTime":1519912951,"sunsetTime":1519953617,"moonPhase":0.49,"precipIntensity":0.0003,"precipIntensityMax":0.0023,"precipIntensityMaxTime":1519887600,"precipProbability":0.1,"precipAccumulation":0.104,"precipType":"snow","temperatureHigh":37.29,"temperatureHighTime":1519945200,"temperatureLow":21.94,"temperatureLowTime":1519984800,"apparentTemperatureHigh":37.29,"apparentTemperatureHighTime":1519945200,"apparentTemperatureLow":13.17,"apparentTemperatureLowTime":1519984800,"dewPoint":11.86,"humidity":0.57,"pressure":1027.13,"windSpeed":3.56,"windGust":17.14,"windGustTime":1519934400,"windBearing":145,"cloudCover":0.44,"uvIndex":3,"uvIndexTime":1519930800,"ozone":399.31,"temperatureMin":13.93,"temperatureMinTime":1519912800,"temperatureMax":37.29,"temperatureMaxTime":1519945200,"apparentTemperatureMin":5.21,"apparentTemperatureMinTime":1519912800,"apparentTemperatureMax":37.29,"apparentTemperatureMaxTime":1519945200},{"time":1519974000,"summary":"Mostly cloudy throughout the day.","icon":"partly-cloudy-day","sunriseTime":1519999259,"sunsetTime":1520040085,"moonPhase":0.53,"precipIntensity":0.0015,"precipIntensityMax":0.0051,"precipIntensityMaxTime":1520017200,"precipProbability":0.09,"precipAccumulation":0.106,"precipType":"snow","temperatureHigh":43.55,"temperatureHighTime":1520031600,"temperatureLow":31.03,"temperatureLowTime":1520085600,"apparentTemperatureHigh":39.71,"apparentTemperatureHighTime":1520035200,"apparentTemperatureLow":24,"apparentTemperatureLowTime":1520085600,"dewPoint":19.33,"humidity":0.59,"pressure":1021.24,"windSpeed":7.17,"windGust":24.25,"windGustTime":1520013600,"windBearing":145,"cloudCover":0.64,"uvIndex":2,"uvIndexTime":1520013600,"ozone":379.22,"temperatureMin":21.94,"temperatureMinTime":1519984800,"temperatureMax":43.55,"temperatureMaxTime":1520031600,"apparentTemperatureMin":13.17,"apparentTemperatureMinTime":1519984800,"apparentTemperatureMax":39.71,"apparentTemperatureMaxTime":1520035200}]},"alerts":[{"title":"Winter Weather Advisory","regions":["Great Salt Lake Desert and Mountains","Northern Wasatch Front","Salt Lake and Tooele Valleys","Southern Wasatch Front","Southwest Utah","West Central Utah"],"severity":"advisory","time":1519414020,"expires":1519430400,"description":"...WINTER WEATHER ADVISORY REMAINS IN EFFECT UNTIL 5 PM MST THIS AFTERNOON... * WHAT...Snow. Additional snow accumulations of up to one inch, with localized amounts up to 2 inches, are expected. * WHERE...Northern Wasatch Front, Salt Lake and Tooele Valleys, Southern Wasatch Front, Great Salt Lake Desert and Mountains, West Central Utah and Southwest Utah. * WHEN...Until 5 PM MST this afternoon. * ADDITIONAL DETAILS...Plan on slippery road conditions. Be prepared for reduced visibilities at times.\n","uri":"https://alerts.weather.gov/cap/wwacapget.php?x=UT125A9308EE7C.WinterWeatherAdvisory.125A93154000UT.SLCWSWSLC.b886c2096870663a551c19dd11e81a90"}],"flags":{"sources":["isd","nearest-precip","nwspa","cmc","gfs","hrrr","madis","nam","sref","darksky"],"isd-stations":["724725-99999","725720-24127","725724-24174","725724-99999","725750-24126","725753-99999","725755-24101","725755-99999","725775-04111","725814-99999","725816-99999","740030-24103","740030-99999","999999-04133","999999-24126","999999-24175"],"units":"us"},
  "offset":-7
}
console.log(testJson);