//  SW version

const version = "1.0";

// Static Cache - App Shell

const appAssets = [
	"index.html",
	"main.js",
	"images/flame.png",
	"images/logo.png",
	"images/sync.png",
	"vendor/bootstrap.min.css",
	"vendor/jquery.min.js",
];

// SW Install
self.addEventListener("install", (e) => {
	e.waitUntil(
		caches.open(`static-${version}`).then((cache) => cache.addAll(appAssets))
	);
});

self.addEventListener("activate", (e) => {
	// Clean static cache
	let cleaned = caches.keys().then((keys) => {
		keys.forEach((key) => {
			if (key !== `static-${version}` && key.match("static-")) {
				return caches.delete(key);
			}
		});
	});
	e.waitUntil(cleaned);
});

// Static cache strategy -Cache with network fallback
const staticCache = async (req, cacheName = `static-${version}`) => {
	const cachedRes = await caches.match(req);
	// Return caches response if found
	if (cachedRes) return cachedRes;
	const networkRes = await fetch(req);
	// update caches with new response
	caches.open(cacheName).then((cache) => cache.put(req, networkRes));
	return networkRes.clone();
};

// Network with cache fallback

const fallbackCache = (req) => {
	// Try network
	return (
		fetch(req)
			.then((networkRes) => {
				// check response is Ok, else go to cache
				if (!networkRes.ok) throw "Fetch error";
				// Update cache
				caches
					.open(`static-${version}`)
					.then((cache) => cache.put(req, networkRes));
				return networkRes.clone();
			})
			// Try cache
			.catch((err) => caches.match(req))
	);
};

// Clean old Giphys from the 'giphy' cache
const cleanGiphyCache = (giphys) => {
	caches.open("giphy").then((cache) => {
		// Get all entries
		cache.keys().then((keys) => {
			// Loop entries (request)
			keys.forEach((key) => {
				// if entry is NOT part of the current gihys, delete it
				if (!giphys.includes(key.url)) {
					cache.delete.key;
				}
			});
		});
	});
};

// SW Fetching

self.addEventListener("fetch", (e) => {
	// App Shell
	if (e.request.url.match(location.origin)) {
		e.respondWith(staticCache(e.request));
		// Giphy API
	} else if (e.request.url.match("api.giphy.com/v1/gifs/trending")) {
		e.respondWith(fallbackCache(e.request));
	} else if (e.request.url.match("giphy.com/media")) {
		e.respondWith(staticCache(e.request, "giphy"));
	}
});

// Listen for message from clien
self.addEventListener("message", (e) => {
	if (e.data.action === "cleanGiphyCache") {
		cleanGiphyCache(e.data.giphys);
	}
});
