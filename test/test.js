if (typeof document === 'undefined') {
  throw new Error('Cache-test needs a browser environment!');
}

var chai = chai || require('chai');
var expect = chai.expect;

const BURST = 10;
const DELAY = 200;
const now = typeof performance !== 'undefined' ? () => performance.now() : () => +new Date();

const strategies = {
  fetch: url => {
    const t0 = now();
    const extension = url.split('?').shift().split('.').pop();
    const corsMode = (extension == 'js') ? 'cors' : 'no-cors';
    return fetch(url, {mode: corsMode}).then(() => now() - t0);
  },
  xhr: url => new Promise(function(resolve) {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    const t0 = now();
    request.onreadystatechange = function() {
      if (this.readyState == 4) resolve(now() - t0);
    };
    request.send();
  }),
  link: url => {
    return new Promise(function (resolve, reject) {
      var loader = document.createElement("link");
      loader.rel = "preload";
      loader.crossOrigin = "anonymous";
      loader.as = "script";
      loader.type = "application/javascript";
      loader.href = url;
      const t0 = now();
      loader.onload = () => resolve(now() - t0);
      loader.onerror = reject;
      document.head.appendChild(loader);
    });
  },
  element: url => new Promise(function (resolve, reject) {
    const extension = url.split('?').shift().split('.').pop();
    if (extension === 'js') {
      const loader = document.createElement("script");
      loader.type = "text/javascript";
      loader.crossOrigin = "anonymous";
      loader.src = url;
      const t0 = now();
      loader.onload = () => {
        resolve(now() - t0);
      }
      document.head.appendChild(loader);
    }
    else if (extension === 'css') {
      const loader = document.createElement("link");
      loader.type = 'text/css';
      loader.rel = 'stylesheet';
      loader.href = url;
      const t0 = now();
      loader.onload = () => resolve(now() - t0);
      document.head.appendChild(loader);
    }
    else if (extension === 'jpg') {
      const loader = new Image();
      loader.style.display = "none";
      const t0 = now();
      loader.onload = () => resolve(now() - t0);
      loader.onerror = reject;
      loader.src = url;
      document.body.appendChild(loader);
    }
    else {
      reject(`Unknown element for extension ${extension}`);
    }
  })
};

const strategyNames = ['fetch', 'xhr', 'link', 'element'];
const extensions = ['js', 'css', 'json', 'jpg'];

const supportsPreload = (function () {
  var loader = document.createElement("link");
  try { return loader.relList.supports('preload'); }
  catch (e) { return false; }
})();

describe('Browser support', function () {
  it('Should support link rel=preload', function () {
    expect(supportsPreload).to.be.true;
  });
  it('Should support Promise', function () {
    expect(Promise).to.exist;
  });
  it('Should support fetch', function () {
    expect(fetch).to.exist;
  });
});

function test(extension, first, second) {
  if (!supportsPreload && (first === 'link' || second === 'link')) {
    return it(`asset.${extension} -- skipped: Browser does not support link rel=preload.`);
  }
  if (extension === 'json' && (first === 'element' || second === 'element')) {
    return it(`asset.${extension} -- skipped: It does not make sense to load json with a script tag.`);
  }
  it(`${first} should cache asset.${extension} for subsequent ${second}`, function (done) {
    const assets = Array.from({length: BURST}, _ => {
      const rand = (+new Date()).toString(35).substr(2) + '.' + Math.random().toString(35).substr(2);
      return `/assets/asset.${extension}?cb=${rand}&delay=${DELAY}`;
    });
    Promise.all(assets.map(url => strategies[first](url)))
      .then(function (ts) { ts.forEach(t => expect(t).to.be.above(DELAY)); })
      .then(function () { return Promise.all(assets.map(url => strategies[second](url))); })
      .then(function (ts) { ts.forEach(t => expect(t).to.be.below(DELAY)); })
      .then(done)
      .catch(done);
  });
}

strategyNames.forEach(function (first) {
  describe(`${first} should cache`, function () {
    this.timeout(5000);
    this.slow(5000);
    strategyNames.forEach(function (second) {
      describe(`for subsequent ${second}`, function() {
        extensions.forEach(function (extension) {
          test(extension, first, second);
        });
      });
    });
  });
});
