/*!
 * VERSION: 2.0
 * DATE: 2016-07-29
 *
 * Copyright (c) 2016, Quentin Mangin. All rights reserved.
 *
 * @author: Quentin Mangin, quentin.mangin@gmail.com
 *
 * #Izzi-visio-conference
 * Izzi Visio Conference is the easiest way to use audio & video live streaming conference
 *
 *
 **/

window.izziVisioConference = function( options ) {
	var _izziVisioConference = this;

	_izziVisioConference.params = {};

	_izziVisioConference.params.localStreamOptions = options;

	_izziVisioConference.servers = {
		iceServers: [_izziVisioConference.params.localStreamOptions.stun, _izziVisioConference.params.localStreamOptions.turn]
	};

	/*
	*
	* FUNCTIONS
	*
	* */

	_izziVisioConference.izziInitLocalStream = function(){
		_izziVisioConference.params.localVideoElement = _izziVisioConference.params.localStreamOptions.localVideoElement;

		var constraints = {audio: _izziVisioConference.params.localStreamOptions.audio == undefined ?true : _izziVisioConference.params.localStreamOptions.audio, video:_izziVisioConference.params.localStreamOptions.video == undefined ?true : _izziVisioConference.params.localStreamOptions.video};

		_izziVisioConference.params.localConnection = new cordova.plugins.iosrtc.RTCPeerConnection({
			iceServers: _izziVisioConference.servers
		});

		cordova.plugins.iosrtc.getUserMedia(constraints,
			function (stream) {

				_izziVisioConference.izziInitLocalStreamSuccess(stream);

			},
			function (error) {
				//TODO HANDLE ERROR
			}
		);
	};

	_izziVisioConference.izziInitLocalStreamSuccess = function(stream){

		_izziVisioConference.params.localStream = stream;

		_izziVisioConference.params.localConnection.addStream(stream);

		_izziVisioConference.params.localVideoElement.src = URL.createObjectURL(stream);
		_izziVisioConference.params.localVideoElement.play();

		_izziVisioConference.params.localStreamOptions.localStreamInited();
	};

	_izziVisioConference.izziInitLocalStreamError = function(){
		//TODO ERROR HANDLER
	};

	/*LOCAL CONNECTION*/

	_izziVisioConference.createLocalConnection = function(options){
		_izziVisioConference.params.localConnectionOptions = options;

		_izziVisioConference.params.localConnection.onicecandidate = _izziVisioConference.sendLocalCandidate;

		_izziVisioConference.params.localConnection.addStream(_izziVisioConference.params.localStream);

		_izziVisioConference.params.localConnection.createOffer(_izziVisioConference.localDescription, _izziVisioConference.signalError, {});
	};

	_izziVisioConference.sendLocalCandidate = function(event){
		_izziVisioConference.params.localConnectionOptions.sendLocalCandidate(event);
	};

	_izziVisioConference.localDescription = function(description){
		_izziVisioConference.params.localConnection.setLocalDescription(description,function(){
			_izziVisioConference.params.localConnectionOptions.localDescription(description);
		}, function(){
			//TODO ERROR HANDLER
		});

	};

	/*REMOTE CONNECTION*/
	_izziVisioConference.createRemoteConnection = function(options){
		_izziVisioConference.params.remoteConnectionOptions = options;

		_izziVisioConference.params.remoteConnection = new cordova.plugins.iosrtc.RTCPeerConnection({
			iceServers: _izziVisioConference.servers
		});

		_izziVisioConference.params.remoteConnection.onicecandidate = _izziVisioConference.sendRemoteCandidate;

		_izziVisioConference.params.remoteConnection.onaddstream = _izziVisioConference.remoteStream;
	};

	_izziVisioConference.sendRemoteCandidate = function(event){
		_izziVisioConference.params.remoteConnectionOptions.sendRemoteCandidate(event);
	};

	_izziVisioConference.remoteStream = function(event){
		_izziVisioConference.params.remoteVideoElement = _izziVisioConference.params.remoteConnectionOptions.remoteVideoElement;
		_izziVisioConference.params.remoteVideoElement.src = URL.createObjectURL(event.stream);
		_izziVisioConference.params.remoteVideoElement.play();
	};

	_izziVisioConference.setRemoteDescription = function(description){
		_izziVisioConference.params.remoteConnection.setLocalDescription(description,function(){}, function(){
			//TODO ERROR HANDLER
		});

		_izziVisioConference.params.remoteConnection.set_local_description(description);
	};

	/*GENERAL*/

	_izziVisioConference.signalError = function(err){
		//TODO HANDLE ERROR
	};

	/*INIT LOCAL STREAM*/
	_izziVisioConference.izziInitLocalStream();

	return {
		/*LOCAL*/
		createLocalConnection : function(options){
			_izziVisioConference.createLocalConnection(options);
		},
		setLocalDescription : function(data){
			_izziVisioConference.params.localConnection.setRemoteDescription(new RTCSessionDescription(data.description),function(){}, function(){
				//TODO ERROR HANDLER
			});
		},
		setLocalCandidate : function(data){
			var newCandidate = new RTCIceCandidate({
				sdpMLineIndex: data.candidate.label,
				candidate: data.candidate.candidate
			});

			_izziVisioConference.params.localConnection.addIceCandidate(newCandidate,function(){},function(){});
		},

		/*REMOTE*/
		createRemoteConnection : function(options){
			_izziVisioConference.createRemoteConnection(options);
		},

		remoteDescription : function(data){
			_izziVisioConference.params.remoteConnection.set_local_description = data.set_local_description;
			_izziVisioConference.params.remoteConnection.setRemoteDescription(new RTCSessionDescription(data.description), function () {
				_izziVisioConference.params.remoteConnection.createAnswer(_izziVisioConference.setRemoteDescription,_izziVisioConference.signalError, {});
			}, function(err){
				//TODO ERROR HANDLER
			});
		},
		setRemoteCandidate : function(data){
			var newCandidate = new RTCIceCandidate({
				sdpMLineIndex: data.candidate.label,
				candidate: data.candidate.candidate
			});

			_izziVisioConference.params.remoteConnection.addIceCandidate(newCandidate,function(){},function(){});
		},
		closeConnection : function(){
			_izziVisioConference.params.localConnection.close();
			_izziVisioConference.params.remoteConnection.close();
			_izziVisioConference.params.localVideoElement.src = '';
			_izziVisioConference.params.remoteVideoElement.src = '';
		}
	}
};