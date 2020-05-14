// const path = require('path');
// const http = require('http');
// const express = require('express');
// const socketio = require('socket.io');

// const app = express();
// const server = http.Server(app);
// const io = socketio(server);

// // Set static folder
// app.use(express.static(path.join(__dirname, 'public')));

// // Run when client connects
// // io.on('connection', socket => {
// //     console.log('New WS Connection...');
// // });

// const PORT = 3000 || process.env.PORT;
// app.listen(PORT, () => console.log( `Server running on port ${PORT}`));

// io.on('connection', function(socket) {
//     console.log('Co nguoi ket noi' + socket.id);
// });

var path = require('path');
var express = require('express');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./utils/users');
var app = express();

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

var server = require('http').Server(app);
var io = require('socket.io')(server);
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChartCord!'));

        // Broadcast when a user connects
        socket.broadcast
              .to(user.room)
              .emit(
                  'message', 
                  formatMessage(botName, `${user.username} has joined the chat`)
               );

               // Send users and room info
               io.to(user.room).emit('roomUsers', {
                   room: user.room,
                   users: getRoomUsers(user.room)
               });
    });

    //  Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Run when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        };

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});