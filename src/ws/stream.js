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

        console.log("User Named (" + data.uName + ") Joined Room (" + data.room + ") With Socket ID (" + data.socketId + ") At (" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() +") On (" + today.getFullYear() + "/" + (today.getMonth()+1) + "/" + today.getDate() + ").");
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

    // Board Controls
    socket.on('boardControls', (data) => {
        socket.to(data.room).emit('boardControls', (data.option));
    });

    // Board Drawing
    socket.on('boardDrawn', (data) => {
        socket.broadcast.to(data.room).emit('boardDrawn', (data.content));
    });

    // Mute Controls
    socket.on('muteCase', (data) => {
        socket.to(data.room).emit('muteCase', (data));
    })
}

module.exports = stream;
