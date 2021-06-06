const http = require('http');

const fs = require('fs');

const socketIO = require("socket.io");

const PORT = process.env.PORT || 8000;
let players = [];
let signs = [];
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


const app = http.createServer((req,res) => {
    console.log(req.method, req.url);
    
    switch(req.url){
        case '/':
            res.setHeader('Content-Type','text/html');
            fs.readFile('./client/index.html',(err,data) => {
                if(err){
                    console.log("Err in reading index.html",err);
                }else{
                    res.write(data);
                    res.end();
                }
            });
            break;
        case '/game.js':
            fs.readFile('./client/game.js',(err,data) => {
                if(err){
                    console.log("Err in reading front.js",err);
                }else{
                    res.write(data);
                    res.end();
                }
            });
            break;
        case '/style.css':
            fs.readFile('./client/style.css',(err,data) => {
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


app.listen(PORT, () => console.log(`Index.html served at http://localhost:${PORT}/`));

const io = socketIO(app);

io.on('connection',(socket) => {
    console.log("A new user has connected : ",socket.id);

    socket.on('new player',(room) => {
        let player = {};
        
        if(!(signs.includes('X'))){
            player['socketId'] = socket.id;
            player['sign'] = 'X';
            signs.push('X');
        }
        else{
            player['socketId'] = socket.id;
            player['sign'] = 'O';
            signs.push('O');
        }
        if(players.length<2){
            
            players.push(player);
            console.log("Connected players :",players);
            socket.emit('assign', player['sign']); // Emit to particular socket the assigned sign for players
            io.emit('connectedEvent', players.length); // Emit to all the no of players online
            if(game.includes('X')){ // If connected player has made first move already
                let sign = 'X';
                let ind = game.indexOf('X');
                socket.emit('update',sign,ind);
            }
            else if(game.includes('O')){
                let sign = 'O';
                let ind = game.indexOf('O');
                socket.emit('update',sign,ind);
            }

        }else{
            console.log("2 players already HouseFull");
            socket.emit('assign', "HouseFull");
        }
    });

    socket.on('move',(ind,sign) => {
        console.log("Received values :",ind,sign);
        if(!(game[ind])) // Only update game board if not updated already
            game[ind] = sign;
        console.log("Game state : ",game);
        let wonValues = hasWon();
        if(wonValues[0]){
            console.log(`Player ${sign} has won`);
            io.emit('won',sign,wonValues[1],wonValues[2],wonValues[3],ind);
            game.fill(null); // Game Over reset game state
        }
        else if(!(game.includes(null))){ // All positions in board played and still not won - draw
            console.log("Game tied");
            io.emit('draw',sign,ind);
        }
        else
            io.emit('update',game[ind],ind);
    });

    socket.on('reset',(playerSign) => {
        console.log("Reset the game");
        game.fill(null);
        io.emit('reset',playerSign);
    });

    socket.on('disconnect',(reason) => {
        console.log(`Client disconnected : ${reason} , socketId : ${socket.id}`);
        if(reason === "transport close"){//Ping timeouts can cause disconnect event during long polling from socket.io
            if(players.length>1){
                let removePlayer = players.filter(player => player['socketId']===socket.id);
                removePlayer = removePlayer[0];
                players = players.filter(player => player['socketId'] !==socket.id);
                signs = signs.filter(sign => sign !== removePlayer['sign']);
                io.emit('playerDisconnected',removePlayer['sign'],players.length);
            }else{// Last player is leaving, reset instead of filtering
                players = [];
                signs = [];
            }

            console.log("Connected Players : ",players);
            game.fill(null);// Player disconnected reset game
        }
        
    });

});

