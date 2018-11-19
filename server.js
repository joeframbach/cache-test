var connect = require('connect');
var http = require('http');
var url = require('url');
var serveStatic = require('serve-static');
var app = connect();

app.use(serveStatic('public'));
app.use('/test', serveStatic('test'));
app.use('/vendor/mocha.css', serveStatic('node_modules/mocha/mocha.css'));
app.use('/vendor/mocha.js', serveStatic('node_modules/mocha/mocha.js'));
app.use('/vendor/chai.js', serveStatic('node_modules/chai/chai.js'));
app.use('/assets', function (req, res, next) {
  req.query = url.parse(req.url, true).query;
  res.setHeader("Cache-Control", "max-age=86400, public");
  res.setHeader("Expires", new Date(Date.now() + 86400000).toUTCString());
  if ('corb' in req.query) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  setTimeout(function () {
    next();
  }, Math.min(10000, Math.max(0, +req.query.delay)));
});
app.use('/assets', serveStatic('assets', {etag: false}));

http.createServer(app).listen(3000);
