
/*global socket, video, config*/
const peerConnections = {};
let torchState=false;
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


	let readyForCall = false;
	let callButton = document.querySelector('#call');
	const videoSelect = document.getElementById('video-device');
	callButton.setAttribute('disabled', videoSelect.selectedIndex > -1);
	callButton.onclick = () => {
		readyForCall = !readyForCall;
		if (readyForCall) {
			start();
			callButton.setAttribute('disabled',true)
		}
	}




	const createOption = (opt,index) => {
		let option = document.createElement('option');
		option.value = opt.id;
		option.text = 'Camera ' + index + ' ' + opt.label;
		return option;
	}

	videoDevice.map((x,index) => {
		videoSelect.appendChild(createOption(x,index));
	});

	videoSelect.onchange = () => {
		callButton.removeAttribute('disabled');
		if (readyForCall) {
			start();
		}
	}

	function start() {
		videoTrack ? videoTrack.stop() : null;
		let deviceId = videoSelect.options[videoSelect.selectedIndex || 0].value;

		const constraints = {
			// audio: true,
			video: { width: 320, height: 240, facingMode: "user", deviceId: deviceId ? { exact: deviceId } : { exact: videoDevice[0].id } }
		};



		navigator.mediaDevices.getUserMedia(constraints)
			.then(function (stream) {
				video.srcObject = stream;

				videoTrack = stream.getVideoTracks()[0]
				const capabilities = videoTrack.getCapabilities()
				// alert(JSON.stringify(capabilities);
				video.addEventListener('loadedmetadata', (e) => {
					window.setTimeout(() => (
						onCapabilitiesReady(videoTrack.getCapabilities())
					), 500);
				});

				function onCapabilitiesReady(capabilities) {


					 
				}

				socket.emit('broadcaster');
			}).catch(error => console.error(error));
	}
	//start();
});


socket.on('answer', function (id, description) {
	peerConnections[id].setRemoteDescription(description);
});

socket.on('watcher', function (id) {
	const peerConnection = new RTCPeerConnection(config);
	peerConnections[id] = peerConnection;
	peerConnection.addStream(video.srcObject);
	peerConnection.createOffer()
		.then(sdp => {
			console.log('offer', sdp)
			peerConnection.setLocalDescription(sdp)
		})
		.then(function () {
			console.log('emmit offer')

			socket.emit('offer', id, peerConnection.localDescription);
		});
	peerConnection.onicecandidate = function (event) {
		console.log('event -', event)
		if (event.candidate) {
			console.log('event2 -', event)
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
	const settings = videoTrack.getSettings();

	let state = !settings.torch;
	torchState=!torchState;
	// alert('Set Torch to - ' + state);
	let param = {};
	if (torchState) {
		param = {
			advanced: [{ torch: torchState }]
		}
	} else {
		param = {
			advanced: [{ torch: torchState }]
		}
	}

	videoTrack.applyConstraints(param)
		.catch(e => alert(e));


})