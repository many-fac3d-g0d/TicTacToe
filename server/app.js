const http = require('http').createServer();

const clientHttp = require('http');

const fs = require('fs');

const io = require("socket.io")(http,{
    cors : {origin : "*"}
});

let players = [];
let rooms = [];
let game = new Array(9).fill(null);

const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]];

function cmp(a, b, c) {
    if (a && b && c)
    return a === b && a === c && b === c;
    }

function hasWon(){
    let won = false;
    for (let i = 0; i < wins.length; i++) {
        let [a, b, c] = wins[i];
        if (cmp(game[a], game[b], game[c])) {
            won = true;
            return [won, a, b, c];
        }
    }
    return [false,0,0,0];
}

io.on('connection',(socket) => {
    console.log("A new user has connected : ",socket.id);

    socket.on('new player',(room) => {
        let player = {};
        
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

    socket.on('move',(ind,sign) => {
        console.log("Received values :",ind,sign);
        game[ind] = sign;
        console.log("Game state : ",game);
        let wonValues = hasWon();
        if(wonValues[0]){
            console.log(`Player ${sign} has won`);
            io.emit('won',sign,wonValues[1],wonValues[2],wonValues[3],ind);
            game.fill(null); // Game Over reset game state
        }
        else
            io.emit('update',sign,ind);
    });

    socket.on('reset',(playerSign) => {
        console.log("Reset the game");
        game.fill(null);
        io.emit('reset',playerSign);
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
