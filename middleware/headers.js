
var pkg = require('../package');

function middleware(req, res, next){
  res.header('Charset','utf8');
  res.header('Cache-Control','public,max-age=60');
  res.header('Server', 'Pelias/'+pkg.version);
  res.header('X-Powered-By', 'mapzen');
  next();
}

module.exports = middleware;