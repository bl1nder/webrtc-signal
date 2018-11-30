/*global io*/
/** @type {RTCConfiguration} */
const config = { // eslint-disable-line no-unused-vars
  'iceServers': [{
    'urls': ['stun:stun.l.google.com:19302']
  }]
};
const IO_SERVER = window.location.origin;
var socket = io.connect(IO_SERVER);

const video = document.querySelector('video'); // eslint-disable-line no-unused-vars
const span = document.querySelector('span'); // eslint-disable-line no-unused-vars

window.onunload = window.onbeforeunload = function() {
	socket.close();
};

