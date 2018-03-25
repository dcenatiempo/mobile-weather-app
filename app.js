const express = require('express');
const cool    = require('cool-ascii-faces'); 
const path    = require('path');
const fetch   = require('node-fetch');
const PORT = process.env.PORT || 5000;

var app = express();

// Static Files Setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes Setup
app.get('/',     (req, res) => res.render('pages/index') );
app.get('/cool', (req, res) => res.send(cool())          );
app.get('/weather/:geo', async (req, res) => {
  let coords = req.params.geo;
  res.json(await getWeather(coords));
});
app.get('/location/reverse/:locale', async (req, res) => {
  let locale = req.params.locale;
  res.json(await reverseGeo(locale));
});
app.get('/location/forward/:locale', async (req, res) => {
  let locale = req.params.locale;
  res.json(await forwardGeo(locale));
});

const server = app.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`);
});

// https://darksky.net/
async function getWeather(myLocale){
  const apiKey = 'fc4be215ca9376fe83fcdcaf1b226d86';
  let url = `https://api.darksky.net/forecast/${apiKey}/${myLocale}`;
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

//https://locationiq.org/
async function reverseGeo(coords){
  // takes a set of coordinates and returns a single formatted locale
  const apiKey = '94be5df0e46402';
  coords = coords.split(',');
  let url = `https://us1.locationiq.org/v1/reverse.php?key=${apiKey}&lat=${coords[0]}&lon=${coords[1]}&format=json`;
  let response = await fetch(url);
  let locale = await response.json();
  locale = extractLocale(locale);
  return locale;
}

async function forwardGeo(searchString){
  // takes a location search string and returns a formatted list of locales
  const apiKey = '94be5df0e46402';
  let url = `https://us1.locationiq.org/v1/search.php?key=${apiKey}&q=${searchString}&format=json&addressdetails=1&zoom=15`;
  let response = await fetch(url);
  let data = await response.json();
  // console.log(data)
  if (data.length === 0) return { "error": "invalid search"};
  data = filterSearchResults(data);
  let localeList = 
    data.map(item => extractLocale(item))
        .filter(item => item !== null);
  console.log(localeList)
  if (localeList.length === 0) return { "error": "no valid results"};
  return localeList;
}

function filterSearchResults (data) {
  // filter out fluff like bars, restuarants, and tourist traps 
  return data.filter( item => item.class === 'place' || item.class === 'boundary');
}

function extractLocale(item) {
  var address = item.address;
  var city, region, country;

  country = address.country;
  if (country === "United States of America") country = 'USA';

  if (address.state) region = address.state;
  else if (address.state_district) region = address.state_district;
  else if (address.region) region = address.region;

  if (address.city) city = address.city;
  else if (address.town) city = address.town;
  else if (address.village) city = address.village;
  else if (address.suburb) city = address.suburb;
  else if (address.hamlet) city = address.hamlet;
  else if (address.county) city = address.county;
  else if (address.postcode) city = address.postcode;
  else if (address.neighbourhood) city = address.neighbourhood;

  if (city)
    return {
      "lat": item.lat,
      "lon": item.lon,
      "city": city,
      "region": region,
      "country": country,
      "id": item.place_id
    };
  else return null;
}