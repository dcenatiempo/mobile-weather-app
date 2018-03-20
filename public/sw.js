const CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  '/',
  '/stylesheets/main.css',
  '/javascript/main.js',
  '/images/Sun.svg',
  '/images/Moon.svg',
  '/images/Cloud.svg',
  '/images/Unknown.svg',
  '/images/Cloud-Sun.svg',
  '/images/Cloud-Moon.svg',
  '/images/Cloud-Rain.svg',
  '/images/Cloud-Snow.svg'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>  {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err=>{
        console.error(err);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch (err =>{
        console.log(err);
      })
  );
});