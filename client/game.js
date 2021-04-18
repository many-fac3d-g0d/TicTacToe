
const socket = io('ws://localhost:8080');

socket.emit('new player');

const _ = document,
cols = Array.from(_.querySelectorAll('.board > span')),
reset = _.querySelector('#reset');
let playerSign = 'O';

socket.on('assign', (sign) =>{
  if(sign!=="HouseFull"){
    playerSign = sign;
    console.log("Player has been assigned ",playerSign);
  }
  else{
    window.alert("2 Players already connected - Server busy"); // Server is occupied remove the eventlisteners
    reset.removeEventListener('click', fnreset);
    for (let col of cols)
      col.removeEventListener('click', play);
    return;
  }
});

function event(can) {
  for (let col of cols)
  if (can)
    col.addEventListener('click', play);
  else
    col.removeEventListener('click', play);
}
event(true);
function play(e) {
  const __ = e.target;
  if (!__.innerHTML) {
    move(parseInt(__.id.split(/\D+/g)[1]), playerSign);
  }
}

function move(ind, sign) {
  socket.emit('move', ind, sign);
}

socket.on('won',(sign,a,b,c,ind)=>{
  console.log(sign, ' wins');
  const span = document.getElementById(`col-${ind}`);
  span.innerHTML = sign === 'O' ? '<h1 name="O">O</h1>' : '<h1 name="X">X</h1>';
  event(false);
  reset.addEventListener('click', fnreset);
  cols[a].classList.add('win');
  cols[b].classList.add('win');
  cols[c].classList.add('win');
  window.alert(`Player ${sign} has won`);
});

socket.on('update',(sign,ind)=>{
  const span = document.getElementById(`col-${ind}`);
  span.innerHTML = sign === 'O' ? '<h1 name="O">O</h1>' : '<h1 name="X">X</h1>';
  if(playerSign===sign)
    event(false);
  else
    event(true);
});

socket.on('reset',(resetPlayer) => {

  window.alert(`Player ${resetPlayer} has reset the game`);
  for (let col of cols) {
    col.classList.remove('win');
    col.innerHTML = '';
  }
  event(true);
  reset.removeEventListener('click', fnreset);
});

function fnreset() {
  socket.emit('reset',playerSign);
}
