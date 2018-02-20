console.log("hello world")
var myLocals = [];
var weather = {};
var cards = {
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

fetch('https://freegeoip.net/json/?callback=')
  .then(resp => {
    return resp.json();
  }).then(json => {
    //console.log(json);
    myLocals = saveLocal(json);
    //console.log(myLocal)
    localStorage.setItem("myLocal", JSON.stringify(myLocals));
    getWeather(myLocals[0]);
  }).catch(err => {
    console.error(err);
    console.warn("trouble getting location")
    myLocals = JSON.parse(localStorage.getItem("myLocal"));
    if (myLocals === null) {
      console.err("no location saved in storage")
    }
    else {
      console.warn("your last saved location is " + myLocals[0].city)
      getWeather(myLocals[0]);
    }
  });

function saveLocal(json){
  return [
    {
      lat: json.latitude,
      long: json.longitude,
      city: json.city,
      state: json.region_code,
      //date: new Date()
    }
  ]
}

function getWeather(myLocal){
  console.log(myLocal)
  var prodUrl = 'https://devins-weather-app.herokuapp.com/';
  var devUrl = 'http://localhost:5000/';
  var path = 'weather/'
  var url = prodUrl + path + myLocal.lat + ',' + myLocal.long;

  fetch(url)
  .then(resp => {
    console.log(resp);
    return resp.json();
  }).then(json => {
    console.log (json)
    weather = json;
  }).catch(err => {
    console.error(err);
  });
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
    card.style.transform = `rotateY(${c[key].rotation}deg)`
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