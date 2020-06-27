// Initialize
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
var stream = require('./ws/stream');
var path = require('path');
const port = 3100;

// Passing UI
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/index.html', express.static(path.join(__dirname + '/index.html')));
app.get('/', (req, res)=>{res.sendFile(__dirname+'/index.html');});

app.use('/.well-known/pki-validation/BEDCF239D9946A175A3E89A67CE52CDA.txt', express.static(path.join(__dirname + '/.well-known/pki-validation/BEDCF239D9946A175A3E89A67CE52CDA.txt')));

// Establish Connection
var today = new Date();
try {
    io.of('/stream').on('connection', stream);
    server.listen(port);
    console.log('\x1b[32m', '####################\n Server Started On Port ' + port + ' At (' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds() +') On (' + today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + ') India Standard Time.\n ####################\n', '\x1b[0m');
} catch (err) {
    console.error('Failed To Start Server. At (' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds() +') On (' + today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + ') India Standard Time. Error Code: ' + err);
}