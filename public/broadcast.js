
/*global socket, video, config*/
const peerConnections = {};
// alert('start')
/** @type {MediaStreamConstraints} */
const constraints = {
	// audio: true,
	// video: { facingMode: "user" }
	video: true
};
let videoTrack;
const devices = navigator.mediaDevices.enumerateDevices().then(result => {
	const videoinput = result.filter(x => x.kind === 'videoinput');
	const videoDevice = videoinput.map(x => ({ id: x.deviceId, label: x.label }));
	alert(JSON.stringify(videoinput));

	const videoSelect = document.getElementById('video-device');
	const createOption = (opt) => {
		let option = document.createElement('option');
		option.value = opt.id;
		option.text = opt.label;
		return option;
	}

	videoDevice.map(x => {
		videoSelect.appendChild(createOption(x));
	})
	videoSelect.onchange = () => {
		start();
	}
	function start() {
		videoTrack?videoTrack.stop():null;
		let deviceId = videoSelect.options[videoSelect.selectedIndex].value;
		
		const constraints = {
			// audio: true,
			// video: { facingMode: "user" }
			video: { deviceId: deviceId ? { exact: deviceId } : { exact: videoDevice[0].id } }
		};



		navigator.mediaDevices.getUserMedia(constraints)
			.then(function (stream) {
				video.srcObject = stream;

				videoTrack = stream.getVideoTracks()[0]
				const capabilities = videoTrack.getCapabilities()
				// alert(JSON.stringify(capabilities)
				video.addEventListener('loadedmetadata', (e) => {
					window.setTimeout(() => (
						onCapabilitiesReady(videoTrack.getCapabilities())
					), 500);
				});

				function onCapabilitiesReady(capabilities) {


					alert(JSON.stringify(capabilities))
				}

				socket.emit('broadcaster');
			}).catch(error => console.error(error));
	}
});


socket.on('answer', function (id, description) {
	peerConnections[id].setRemoteDescription(description);
});

socket.on('watcher', function (id) {
	const peerConnection = new RTCPeerConnection(config);
	peerConnections[id] = peerConnection;
	peerConnection.addStream(video.srcObject);

	peerConnection.createOffer()
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(function () {
			socket.emit('offer', id, peerConnection.localDescription);
		});
	peerConnection.onicecandidate = function (event) {
		if (event.candidate) {
			socket.emit('candidate', id, event.candidate);
		}
	};
});

socket.on('candidate', function (id, candidate) {
	if (peerConnections) {
		peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
	}
});

socket.on('bye', function (id) {
	peerConnections[id] && peerConnections[id].close();
	delete peerConnections[id];

});
socket.on('torch', function () {

	videoTrack.applyConstraints({
		advanced: [{ torch: true }]
	})
		.catch(e => console.log(e));


})