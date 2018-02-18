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

const server = app.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`);
});

// I cannot use api key from client side... must set up node server :(
async function getWeather(myLocal){
  const apiKey = 'fc4be215ca9376fe83fcdcaf1b226d86';
  let url = `https://api.darksky.net/forecast/${apiKey}/${myLocal}`;
  let response = await fetch(url);
  let data = await response.json();
  return data;
}
