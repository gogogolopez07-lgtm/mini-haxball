const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function generateRoomCode(){
    return Math.random().toString(36).substring(2,6).toUpperCase();
}

io.on("connection", socket => {

    socket.on("createRoom", ()=>{
        const code = generateRoomCode();
        rooms[code] = [socket.id];
        socket.join(code);
        socket.emit("roomCreated", code);
    });

    socket.on("joinRoom", code=>{
        if(rooms[code] && rooms[code].length < 2){
            rooms[code].push(socket.id);
            socket.join(code);
            io.to(code).emit("startGame");
        } else {
            socket.emit("errorRoom");
        }
    });

    socket.on("gameState", ({code, state})=>{
        socket.to(code).emit("gameState", state);
    });

    socket.on("disconnect", ()=>{
        for(const code in rooms){
            rooms[code] = rooms[code].filter(id=>id!==socket.id);
            if(rooms[code].length === 0) delete rooms[code];
        }
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log("Servidor activo"));