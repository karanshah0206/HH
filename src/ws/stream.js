/*
    Copyright 2020 Karan Shah.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

var today = new Date();

const stream = (socket) => {
    socket.on('subscribe', (data) => {
        // Join a room
        socket.join(data.room);
        socket.join(data.socketId);

        // Inform New User Arrival
        if(socket.adapter.rooms[data.room].length > 1){
            socket.to(data.room).emit('new user', {socketId:data.socketId, username:data.uName});
        }

        console.log("User Named (" + data.uName + ") Joined Room (" + data.room + ") With Socket ID (" + data.socketId + ") At (" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() +") On (" + today.getFullYear() + "/" + (today.getMonth()+1) + "/" + today.getDate() + ") India Standard Time.");
    });

    // New User
    socket.on('newUserStart', (data) => {
        socket.to(data.to).emit('newUserStart', {sender:data.sender});
    });

    socket.on('sdp', (data)=>{
        socket.to(data.to).emit('sdp', {description: data.description, sender:data.sender});
    });

    socket.on('ice candidates', (data)=>{
        socket.to(data.to).emit('ice candidates', {candidate:data.candidate, sender:data.sender});
    });

    // Chat
    socket.on('chat', (data)=>{
        socket.to(data.room).emit('chat', {sender: data.sender, msg: data.msg});
    });

    // Board
    socket.on('boardControls', (data) => {
        socket.to(data.room).emit('boardControls', (data.option));
    })
}

module.exports = stream;