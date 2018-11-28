/*global socket, video, config*/
let peerConnection;
let connections = {};
const getPeer = (id) => {
	return connections[id];
}
const exist = (id) => {
	let elem = document.getElementById('video-panel__item-' + id.slice(1));
	return elem;
}
const insertVideoTag = (id, event, capabilities) => {
	id=id.slice(1)
	const panel = document.getElementsByClassName('video-panel')[0];
	let item = document.createElement('div');
	item.id='video-panel__item-'+id;
	item.className = 'video-panel__item';
	const span = document.createElement('span')
	span.className = 'video-info';

	const v = document.createElement('video');
	v.id = 'stream-' + id;
	v.srcObject = event.stream;
	v.setAttribute('autoplay', '');
	v.setAttribute('muted', '');
	item.appendChild(v);

	let button = document.createElement('button');
	button.innerText = 'TORCH';
	button.id = 'stream-torch' + id;

	item.appendChild(button);

	debugger;
	panel.appendChild(item);
	panel.appendChild(span);

	button.onclick = () => {
		debugger;
		alert('click')
		switchLight();
	};
	return panel;
}

const updateVideoTag = (id, event,capabilities) => {
	id=id.slice(1);
	const selector='video-panel__item-' + id;
	console.log(selector);
	let panel = document.getElementById(selector);
	let video = panel.children[0];
	video.pause();
	video.srcObject = event.stream;
	video.play();

}

socket.on('offer', function (id, description) {


	peerConnection = new RTCPeerConnection(config);
	connections[id] = peerConnection;
	getPeer(id).setRemoteDescription(description)
		.then(() => peerConnection.createAnswer())
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(function () {
			socket.emit('answer', id, peerConnection.localDescription);
		});
	getPeer(id).onaddstream = function (event) {
		const videoTrack = event.stream.getVideoTracks()[0];
		
		const capabilities = videoTrack.getCapabilities()
		console.log(capabilities, event.stream.getVideoTracks());

		if (!exist(id)) {
			insertVideoTag(id, event, capabilities)
		} else {
			updateVideoTag(id, event,capabilities);
		}
	};
	getPeer(id).onicecandidate = function (event) {
		if (event.candidate) {
			socket.emit('candidate', id, event.candidate);
		}
	};
});

socket.on('candidate', function (id, candidate) {
	getPeer(id).addIceCandidate(new RTCIceCandidate(candidate))
		.catch(e => console.error(e));
});

socket.on('connect', function () {
	socket.emit('watcher');
});

socket.on('broadcaster', function () {
	socket.emit('watcher');
});

socket.on('bye', function (id) {
	console.log('bye');
	
	let v1 =  document.getElementById('video-panel__item-'+id.slice(1));
	if (v1) {

		v1.parentNode.removeChild(v1)
	}
	getPeer(id).close();
});
function switchLight() {

	socket.emit('torch');
}