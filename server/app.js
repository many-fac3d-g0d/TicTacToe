const http = require('http').createServer();

const clientHttp = require('http');

const fs = require('fs');

const io = require("socket.io")(http,{
    cors : {origin : "*"}
});

var players = [];
var rooms = [];

io.on('connection',(socket) => {
    console.log("A new user has connected : ",socket.id);

    socket.on('new player',(room) => {
        var player = {};
        
        if(players.length===0)
            player[socket.id] = 'X'    //First Player
        else if(players.length===1)
            player[socket.id] = 'O'    //Second Player
        
        if(players.length<2){
            
            players.push(player);
            console.log("Connected players :",players);
            socket.emit('assign', player[socket.id]);

        }else{
            console.log("2 players already HouseFull");
            socket.emit('assign', "HouseFull");
        }
    });
});

const app = clientHttp.createServer((req,res) => {
    console.log(req.method, req.url);
    
    switch(req.url){
        case '/':
            res.setHeader('Content-Type','text/html');
            fs.readFile('../client/index.html',(err,data) => {
                if(err){
                    console.log("Err in reading index.html",err);
                }else{
                    res.write(data);
                    res.end();
                }
            });
            break;
        case '/game.js':
            fs.readFile('../client/game.js',(err,data) => {
                if(err){
                    console.log("Err in reading front.js",err);
                }else{
                    res.write(data);
                    res.end();
                }
            });
            break;
        case '/style.css':
            fs.readFile('../client/style.css',(err,data) => {
                if(err){
                    console.log("Err in reading style.css",err);
                }else{
                    res.write(data);
                    res.end();
                }
            });
            break;
        default:
            res.statusCode = 404;
            res.write("<p>Page not found</p>");
            break;
    }
        


});

http.listen(8080, () => console.log("Server started at http://localhost:8080/") );
app.listen(8000, () => console.log("Index.html served at http://localhost:8000/"));
