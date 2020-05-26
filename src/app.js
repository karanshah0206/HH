// Initialize
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
var stream = require('./ws/stream');
var path = require('path');
const port = 3000;

// Passing UI
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res)=>{res.sendFile(__dirname+'/index.html');});

// Establish Connection
try {
    io.of('/stream').on('connection', stream);
    server.listen(port);
    console.log('Listening On Port ' + port);
} catch (err) {
    console.log('Unable To Established Connection On Port ' + port + '. Error Code: ' + err);
}