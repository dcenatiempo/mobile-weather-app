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
app.get('/location/reverse/:local', async (req, res) => {
  let local = req.params.local;
  res.json(await reverseGeo(local));
});
app.get('/location/forward/:local', async (req, res) => {
  let local = req.params.local;
  res.json(await forwardGeo(local));
});

const server = app.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`);
});

// https://darksky.net/
async function getWeather(myLocal){
  const apiKey = 'fc4be215ca9376fe83fcdcaf1b226d86';
  let url = `https://api.darksky.net/forecast/${apiKey}/${myLocal}`;
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

//https://locationiq.org/
async function reverseGeo(local){
  const apiKey = '94be5df0e46402';
  local = local.split(',');
  let url = `https://us1.locationiq.org/v1/reverse.php?key=${apiKey}&lat=${local[0]}&lon=${local[1]}&format=json`;
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

async function forwardGeo(local){
  const apiKey = '94be5df0e46402';
  let url = `https://us1.locationiq.org/v1/search.php?key=${apiKey}&q=${local}&format=json`;
  let response = await fetch(url);
  let data = await response.json();
  return data;
}