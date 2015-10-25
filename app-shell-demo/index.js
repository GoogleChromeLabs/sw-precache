require('babel/register');

var server = require('./src/server');
server.listen(process.env.PORT || 8080);
