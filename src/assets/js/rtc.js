/*
    Copyright 2020 Karan Shah.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import h from './helpers.js';

window.addEventListener('load', () => {
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if (!room) {
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
    }

    else if (!username) {
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
    }

    else {
        let commElem = document.getElementsByClassName('room-comm');

        for(let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
        }

        var pc = [];

        let socket = io('/stream');

        var socketId = '';
        var myStream =  '';
        var screen = '';
        var recordedStream = [];
        var mediaRecorder = '';

        //Get user video by default
        getAndSetUserStream();

        socket.on('connect', () => {
            socketId = socket.io.engine.id;

            // Joining Room
            socket.emit('subscribe', {
                room: room,
                socketId: socketId,
                uName: username
            });

            // New User Joined
            socket.on('new user', (data) => {
                socket.emit('newUserStart', {to:data.socketId, sender:socketId});
                pc.push(data.socketId);
                init(true, data.socketId);
                new_user(data);
            });

            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });

            socket.on('ice candidates', async (data) => {
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });

            socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    h.getUserFullMedia().then(async (stream) => {
                        if (!document.getElementById('local').srcObject) {
                            h.setLocalStream(stream);
                        }
                        if (!document.getElementById('local-hidden').srcObject) {
                            h.setLocalStream(stream);
                        }

                        //save my stream
                        myStream = stream;

                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();
                        
                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', {description:pc[data.sender].localDescription, to:data.sender, sender:socketId});
                    }).catch((e) => {
                        console.error(e);
                    });
                }

                else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });

            // Chat
            socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            })
        });

        // Stream User Video
        function getAndSetUserStream() {
            h.getUserFullMedia().then((stream) => {
                //save my stream
                myStream = stream;    
                h.setLocalStream(stream);
            }).catch((e) => {
                console.error('Error Streaming (' + e + ').');
            });
        }

        // Send Chat Messagee
        function sendMsg(msg) {
            let data = {
                room: room,
                msg: msg,
                sender: username
            };

            // Emit Chat Message
            socket.emit('chat', data);


            // Add Local Chat
            h.addChat(data, 'local');
        }

        // Initialize
        function init (createOffer, partnerName) {
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());
            
            if (screen && screen.getTracks().length) {
                screen.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, screen);
                });
            }

            else if (myStream) {
                myStream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, myStream);
                });
            }

            else {
                h.getUserFullMedia().then((stream) => {
                    myStream = stream;

                    stream.getTracks().forEach((track) => {
                        pc[partnerName].addTrack(track, stream);
                    });

                    h.setLocalStream(stream);
                }).catch((e) => {
                    console.error('Error Streaming (' + err + ').');
                });
            }

            // Create Offer
            if (createOffer) {
                pc[partnerName].onnegotiationneeded = async () => {
                    let offer = await pc[partnerName].createOffer();
                    
                    await pc[partnerName].setLocalDescription(offer);
                    socket.emit('sdp', {description:pc[partnerName].localDescription, to:partnerName, sender:socketId});
                };
            }

            // Send Ice Candidates To Partner Names
            pc[partnerName].onicecandidate = ({candidate}) => {
                socket.emit('ice candidates', {candidate: candidate, to:partnerName, sender:socketId});
            };

            // Add
            pc[partnerName].ontrack = (e) => {
                let str = e.streams[0];
                if (document.getElementById(`${partnerName}-video`)) {
                    document.getElementById(`${partnerName}-video`).srcObject = str;
                }

                else {
                    // Video Elem
                    let newVid = document.createElement('video');
                    newVid.id = `${partnerName}-video`;
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.className = 'remote-video';

                    // video Controls Elements
                    let controlDiv = document.createElement('div');
                    controlDiv.className = 'remote-video-controls';
                    controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                        <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

                    // Create a new div for card
                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card card-sm';
                    cardDiv.id = partnerName;
                    cardDiv.appendChild(newVid);
                    cardDiv.appendChild(controlDiv);

                    //put div in main-section elem
                    document.getElementById('videos').appendChild(cardDiv);

                    h.adjustVideoElemSize();
                }
            };

            // Disconnection Management
            pc[partnerName].onconnectionstatechange = (d) => {
                switch(pc[partnerName].iceConnectionState) {
                    case 'disconnected':
                    case 'failed':
                        h.closeVideo(partnerName);
                        break;
                    case 'closed':
                        h.closeVideo(partnerName);
                        break;
                }
            };

            pc[partnerName].onsignalingstatechange = (d) => {
                switch(pc[partnerName].signalingState) {
                    case 'closed':
                        console.log("Signalling state is 'closed'");
                        h.closeVideo(partnerName);
                        break;
                }
            };
        }

        // Screen Sharing
        function shareScreen() {
            h.shareScreen().then((stream) => {
                h.toggleShareIcons(true);

                // Disable Video On/Off Control
                h.toggleVideoBtnDisabled(true);

                screen = stream;

                // Stream Shared Screen
                broadcastNewTracks(stream, 'video', true);

                // Stop Sharing
                screen.getVideoTracks()[0].addEventListener('ended', () => {
                    stopSharingScreen();
                });
            }).catch((e) => {
                console.error('Error Sharing Screen (' + e + ').');
            });
        }

        function stopSharingScreen() {
            // Enable Video On/Off Control
            h.toggleVideoBtnDisabled(false);

            return new Promise((res, rej) => {
                screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';
                res();
            }).then(() => {
                h.toggleShareIcons(false);
                broadcastNewTracks(myStream, 'video');
            }).catch((e) => {
                console.error(e);
            });
        }

        function broadcastNewTracks(stream, type, mirrorMode=true) {
            h.setLocalStream(stream, mirrorMode);
            let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for(let p in pc) {
                let pName = pc[p];
                if (typeof pc[pName] == 'object') {
                     h.replaceTrack(track, pc[pName]);
                }
            }
        }

        function toggleRecordingIcons(isRecording) {
            let e = document.getElementById('record');

            if (isRecording) {
                e.setAttribute('title', 'Stop recording');
                e.children[0].classList.add('text-danger');
                e.children[0].classList.remove('text-white');
            }

            else {
                e.setAttribute('title', 'Record');
                e.children[0].classList.add('text-white');
                e.children[0].classList.remove('text-danger');
            }
        }


        function startRecording(stream) {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorder.start(1000);
            toggleRecordingIcons(true);

            mediaRecorder.ondataavailable = function (e) {
                recordedStream.push(e.data);
            }

            mediaRecorder.onstop = function () {
                toggleRecordingIcons(false);

                h.saveRecordedStream(recordedStream, username);

                setTimeout(() => {
                    recordedStream = [];
                }, 3000);
            }

            mediaRecorder.onerror = function (e) {
                console.error(e);
            }
        }


        // Chat Area
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.which === 13 && (e.target.value.trim())) {
                e.preventDefault();
                
                sendMsg(e.target.value);

                setTimeout(() => {
                    e.target.value = '';
                }, 50);
            }
        });

        // Video On/Off Controls
        document.getElementById('toggle-video').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-video');
            
            if (myStream.getVideoTracks()[0].enabled) {
                e.target.classList.add('fa-video-slash');
                e.target.classList.remove('fa-video');
                elem.setAttribute('title', 'Show Video');

                myStream.getVideoTracks()[0].enabled = false;
            }

            else {
                e.target.classList.add('fa-video');
                e.target.classList.remove('fa-video-slash');
                elem.setAttribute('title', 'Hide Video');

                myStream.getVideoTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'video');
        });


        // Audio On/Off Control
        document.getElementById('toggle-mute').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-mute');
            
            if (myStream.getAudioTracks()[0].enabled) {
                e.target.classList.add('fa-microphone-alt-slash');
                e.target.classList.remove('fa-microphone-alt');
                elem.setAttribute('title', 'Unmute');

                myStream.getAudioTracks()[0].enabled = false;
            }

            else {
                e.target.classList.add('fa-microphone-alt');
                e.target.classList.remove('fa-microphone-alt-slash');
                elem.setAttribute('title', 'Mute');

                myStream.getAudioTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'audio');
        });


        // Share Screen Control
        document.getElementById('share-screen').addEventListener('click', (e) => {
            e.preventDefault();

            if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
                stopSharingScreen();
            }

            else {
                shareScreen();
            }
        });


        // Record Button Control
        document.getElementById('record').addEventListener('click', (e) => {
            if (!mediaRecorder || mediaRecorder.state == 'inactive') {
                h.toggleModal('recording-options-modal', true);
            }

            else if (mediaRecorder.state == 'paused') {
                mediaRecorder.resume();
            }

            else if (mediaRecorder.state == 'recording') {
                mediaRecorder.stop();
            }
        });


        // Recording Screen
        document.getElementById('record-screen').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (screen && screen.getVideoTracks().length) {
                startRecording(screen);
            }

            else {
                h.shareScreen().then((screenStream) => {
                    startRecording(screenStream);
                }).catch(() => {});
            }
        });

        // Recording Personal Video
        document.getElementById('record-video').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (myStream && myStream.getTracks().length) {
                startRecording(myStream);
            }

            else {
                h.getUserFullMedia().then((videoStream) => {
                    startRecording(videoStream);
                }).catch(() => {});
            }
        });
    }
});