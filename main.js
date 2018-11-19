const commands = {
    fetch: url => fetch(url, {mode: "cors"}),
    xhr: url => new Promise(function(resolve) {
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onreadystatechange = function() {
            if (this.readyState == 4) resolve();
        };
        request.send();
    }),
    link: url => new Promise(function (resolve) {
        try {
            var loader = document.createElement("link");
            loader.rel = "preload";
            loader.as = "script";
            loader.crossOrigin = "anonymous";
            loader.type = "application/x-javascript";
            loader.href = url;
            loader.onload = resolve;
            setTimeout(function () {
                console.log('timing out');
                resolve();
            }, 1000);
            loader.onerror = function () {
                debugger;
                console.log('XX', arguments);
                resolve();
            };
            document.head.appendChild(loader);
        } catch (e) {
            debugger;
            console.log('XX', e);
            resolve();
        }
    }),
    el: url => new Promise(function (resolve) {
        try {
            const extension = url.split('?')[0].split('.').reverse()[0];
            if (extension === 'js') {
                var loader = document.createElement("script");
                loader.type = "text/javascript";
                loader.crossOrigin = "anonymous";
                loader.src = url;
                loader.onload = resolve;
                loader.onerror = function () {
                    debugger;
                    console.log('XX', arguments);
                    resolve();
                };
                document.head.appendChild(loader);
            }
            if (extension === 'css') {
                var loader = document.createElement("link");
                loader.type = 'text/css';
                loader.rel = 'stylesheet';
                loader.href = url;
                loader.onload = resolve;
                document.head.appendChild(loader);
            }
        } catch (e) {
            debugger;
            console.log('XX', e);
            resolve();
        }
    })
};

const now = () => performance ? performance.now() : +new Date();

Array.prototype.concat.apply([], document.querySelectorAll('[data-todo]')).forEach(el => {
    const t0 = now();
    const [first, second] = el.dataset.todo.split(',');
    // const url = 'https://images-na.ssl-images-amazon.com/images/I/61gI9g8kEwL.js?' + Math.random();
    const ext = el.dataset.extension;
    const url = '/asset.' + ext + '?' + Math.random();
    // commands.el(url+'_a');
    commands[first](url).then(_ => {
        const t1 = now();
        console.log(url, first, t0, t1 - t0);
        // commands.el(url+'_b');
        commands[second](url).then(_ => {
            const t2 = now();
            console.log(url, first, second, t0, t1 - t0, t2 - t1);
            el.innerHTML = '<p>' + first + ',' + second + ': ' + (t1 - t0).toFixed(1) + ', ' + (t2 - t1).toFixed(1) + '</p>';
        });
    });
});
// var url = 'https://images-na.ssl-images-amazon.com/images/I/61gI9g8kEwL.js?' + Math.random();
// link(url).then(function () {
//     commands.el(url).then(function () {
//         //
//     });
// });

/**
 * Cache usage when making requests in succession:
 * 
 *             Fetch-Fetch   Fetch-XHR  Fetch-El  XHR-Fetch  XHR-XHR  XHR-El
 * SAFARI           o            o         o         X          X        o
 * FIREFOX          o(1)         X         X         X          o(1)     o(1)
 * CHROME           o            o         o         o          o        o
 * EDGE             o(2)         o         o         o(2)       o        o
 * 
 * Notes:
 * 1. Firefox sends If-Modified-When and If-None-Match headers with subsequent *cached* requests.
 * 2. Edge sends If-Modified-When and If-None-Match headers with subsequent *fetch* requests.
 * Safari's Network tab does not show full asset name with querystring, very annoying.
 * Firefox disables cache for *all* requests (inital and subsequent) when refreshing via cmd+refresh.
 */
