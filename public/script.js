const socket=io('/')
const myPeer=new Peer(undefined, {
    host: '/',
    port: '3001'
})

//get the my video grid element and muted own audio
const videoGrid=document.getElementById('video-grid')
const myVideo=document.createElement('video')
myVideo.muted=true

const peers={}
let ownId=''


//load to video
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream=>{
    //add the video stream to my video grid
    addVideoStream(myVideo, stream)

    //Send the video stream to other users in the room
    socket.on('user-connected', userId=>{
        connectToNewUser(userId, stream, ownId)

    })

    //call listener
    myPeer.on('call', call=>{
        //console.log('here ', call.metadata);
        call.answer(stream)
        //display other user video when stream comes in
        const video=document.createElement('video')
        call.on('stream', userVideoStream=>{
            addVideoStream(video, userVideoStream)
        })

        call.on('close', ()=>{
            video.remove()
        })

        //save the call info 
        console.log('OtherId is ', call.metadata);
        peers[call.metadata]=call

    })
})

myPeer.on('open', id=>{
    //console.log('own id is ', id);
    ownId=id
    socket.emit('join-room', ROOM_ID, id)
})


//close the call when other users are disconnected
socket.on('user-disconnected', userId=>{
    console.log(peers);
    console.log(userId);
    if(peers[userId]){
        console.log('closing...');
        peers[userId].close()
    }
})

function addVideoStream(video, stream) {
    video.srcObject=stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play()
    })
    videoGrid.append(video)

}

function connectToNewUser(userId, stream, ownId){
    //call the other user
    const call=myPeer.call(userId, stream, {metadata: ownId})
    const video=document.createElement('video')
    //get the user's media stream and display in video
    call.on('stream', userVideoStream=>{
        addVideoStream(video, userVideoStream)
    })

    //remove the video when call is disconnected
    call.on('close', ()=>{
        video.remove()
    })

    //save the call info
    peers[userId]=call
}
