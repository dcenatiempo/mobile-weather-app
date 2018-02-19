// location api
//https://freegeoip.net/json/?callback=?


console.log("hello world")
var myLocal = {};
var weather = {};

fetch('https://freegeoip.net/json/?callback=')
  .then(resp => {
    return resp.json();
  }).then(json => {
    //console.log(json);
    myLocal = saveLocal(json);
    //console.log(myLocal)
    localStorage.setItem("myLocal", JSON.stringify(myLocal));
    getWeather(myLocal);
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
    myLocal = JSON.parse(localStorage.getItem("myLocal"));
    if (myLocal === null) {
      console.err("no location saved in storage")
    }
    else {
      console.warn("your last saved location is " + myLocal.city)
      getWeather(myLocal);
    }
  });

function saveLocal(json){
  return {
    lat: json.latitude,
    long: json.longitude,
    city: json.city,
    state: json.region_code,
    //date: new Date()
  };
}


function getWeather(myLocal){
//   var prodUrl = 'https://devins-weather-app.herokuapp.com/';
//   var devUrl = 'http://localhost:5000/';
//   var path = 'weather/'
//   var url = devUrl + path + myLocal.lat + ',' + myLocal.long;
//   var request = new Request(url, {
//       mode: 'no-cors'
//     });
// //TODO: figure out CORS settings for production
//   fetch(request)
//   .then(resp => {
//     console.log(resp);
//     return resp.json();
//   }).then(json => {
//     console.log (json)
//     weather = json;
//   }).catch(err => {
//     console.error(err);
//   });
}

var weatherCards = document.querySelectorAll('.city-page')
for (let i=0; i<weatherCards.length; i++){

  weatherCards[i].addEventListener('click', e => {
    console.log(i + " clicky!");
    weatherCards[i].classList.toggle('back');
    weatherCards[i].classList.toggle('front');
    weatherCards[Math.abs(i-1)].classList.toggle('back');
    weatherCards[Math.abs(i-1)].classList.toggle('front');
  })

}