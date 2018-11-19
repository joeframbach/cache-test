# Cache Test

There are several ways for a browser to request an asset from a server.

- Append an element to the DOM
- `XMLHttpRequest`
- `fetch`
- `<link rel="preload">`

Ideally, the browser should cache the response, then pull from the cache on subsequent requests.

To improve latency, you could precache assets needed for the next navigation, or precache late-discovered dependencies.

However, browser support for all the above features is spotty, and the caching behavior is inconsistent.

This test runner shows caching bahavior when request strategies are mixed. For example, on Firefox, an HXR immediately followed by a Fetch requests the asset twice, ignoring the cache. On Safari, a Fetch immediately followed by appending a script tag to the DOM requests the asset twice, ignoring the cache.

## Asset Server

This serves a limited set of assets:

- /asset/asset.js
- /asset/asset.css
- /asset/asset.json
- /asset/asset.jpg

Each may take the query parameters:

- `?delay=n`: Delay for `n` milliseconds before responding.
- `?corb`: Add `X-Content-Type-Options: nosniff` to the response header.
- `?cachebust=abc123`: Doesn't do anything, but is used for cachebusting.

By default, the responses are cached for 24 hours via both `Expires` and `Cache-Control` headers.

## Test Runner

Runs each combination of `filetype`&times;`cache-strategy`&times;`request-strategy`. Skips `link` strategy for browsers which do not support `link rel=preload` (Firefox and Edge).

Example output from Firefox:

```
xhr should cache

    for subsequent fetch
        ✗ xhr should cache asset.js for subsequent fetch
        ✗ xhr should cache asset.css for subsequent fetch
        ✗ xhr should cache asset.json for subsequent fetch
        ✗ xhr should cache asset.jpg for subsequent fetch

    for subsequent xhr
        ✓ xhr should cache asset.js for subsequent xhr
        ✓ xhr should cache asset.css for subsequent xhr
        ✓ xhr should cache asset.json for subsequent xhr
        ✓ xhr should cache asset.jpg for subsequent xhr

    for subsequent link
        · asset.js -- skipped: Browser does not support link rel=preload.
        · asset.css -- skipped: Browser does not support link rel=preload.
        · asset.json -- skipped: Browser does not support link rel=preload.
        · asset.jpg -- skipped: Browser does not support link rel=preload.

    for subsequent element
        ✓ xhr should cache asset.js for subsequent element
        ✓ xhr should cache asset.css for subsequent element
        · asset.json -- skipped: It does not make sense to load json with a script tag.
        ✗ xhr should cache asset.jpg for subsequent element 
```

## Running the tests

```
npm install
node server.js
```

Visit `localhost:3000`. The tests will automatically begin.

Command-line test `npm test` will not work -- the tests require a browser environment.

## TODO

Looking for automated browser testing and reporting for all major browsers. Probably Browserstack, or I could rewrite for TestCafe.

Looking for a good way to visualize the results. Kangax's browser compatibility table has potential.
