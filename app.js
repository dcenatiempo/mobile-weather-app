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

const server = app.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`);
});


