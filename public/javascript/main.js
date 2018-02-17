// location api
//https://freegeoip.net/json/?callback=?

// weather api
// https://api.darksky.net/forecast/fc4be215ca9376fe83fcdcaf1b226d86/37.8267,-122.4233

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

// I cannot use api key from client side... must set up node server :(
function getWeather(myLocal){
  var url = 'https://api.darksky.net/forecast/fc4be215ca9376fe83fcdcaf1b226d86/' +
  myLocal.lat + ',' + myLocal.long + '?callback=?';
  var request = new Request(url, {
      mode: 'cors'
    });

  fetch(request)
  .then(resp => {
    console.log(resp)
    return resp.json();
  }).then(json => {
    console.log(json);
  }).catch(err => {
    console.error(err);
  });
}

