let Peer = require('simple-peer');
let socket = io();
const video = document.querySelector('video');
let client = {}


//get stream and permission from client
navigator.mediaDevices.getUserMedia({video:true, audio:true})
.then(stream=>{
  socket.emit('NewClient')
  video.srcObject = stream
  video.play()

  function InitPeer(type){
    let peer = new Peer({initiator:(type==='init')?true:false, stream:stream, trickle:false})
    peer.on('stream', (stream)=>{
      CreateVideo(stream)
    })
    peer.on('close', ()=>{
      document.getElementById("peerVideo").remove()
      peer.destroy()
    })
    return peer
  }

  //for peeer of type init
  function MakePeer(){
    client.gotAnswer = false;
    let peer = (InitPeer('init'))
    peer.on('signal', (data)=>{
      if (!client.gotAnswer) {
        socket.emit('Offer', data)
      }
    })
    client.peer = peer
  }

//for peeer of type not init
  function FrontAnswer(offer){
    let peer = InitPeer('notInit')
    peer.on('signal', (data)=>{
      socket.emit('Answer', data)
    })
    peer.signal(offer)
  }


  function SignalAnswer(answer){
    client.gotAnswer = true;
    let peer = client.peer
    peer.signal(answer)
  }

  function CreateVideo(stream){
    let video = document.createElement('video')
    video.id = 'peerVideo'
    video.srcObject = stream
    video.class = 'embed-responsive-item'
    document.querySelector('#peerDiv').appendChild(video)
    video.play()
  }

  function SessionActive(){
    document.write('session active, please try after some time.')
  }

  socket.on('BackOffer', FrontAnswer)
  socket.on('BackAnswer', SignalAnswer)
  socket.on('SessionActive', SessionActive)
  socket.on('CreatePeer', MakePeer)


})
.catch(error=>{
  document.write(error)
})
