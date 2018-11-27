/*global socket, video, config*/
let peerConnection;
let connections = {};
const getPeer = (id) => {
	return connections[id];
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
		const videoTrack = event.stream.getVideoTracks()[0]
		const capabilities = videoTrack.getCapabilities()
		console.log(capabilities, event.stream.getVideoTracks())
		span.innerText = JSON.stringify(capabilities);
		video.srcObject = event.stream;
		const container = video.parentNode;
		let v1 = document.getElementById('stream-' + id);
		let button = document.getElementById('stream-torch' + id);
		if (!button) {
			button = document.createElement('button');
			button.innerText = 'TORCH';
			button.id = 'stream-torch' + id;
			container.appendChild(button);
			button.setAttribute('onclick', 'switchLight();')
			button.addEventListener('onclick', () => {
				debugger;
				alert('click')
				switchLight();
			})
		}
		if (!v1) {
			const span = document.querySelector('span');

			const v = document.createElement('video');
			v.id = 'stream-' + id;
			v.srcObject = event.stream;
			v.setAttribute('autoplay', '')
			v.setAttribute('muted', '')
			container.appendChild(v);
		} else {
			v1.srcObject = event.stream;
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
	console.log('bye')
	let v1 = document.getElementById('stream-' + id);
	if (v1) {

		v1.parentNode.removeChild(v1)
	}
	getPeer(id).close();
});
function switchLight() {
 
	socket.emit('torch');
}