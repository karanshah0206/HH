import h from './helpers.js';

window.addEventListener('load', () => {
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if (!room) {
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
        document.getElementById('globalFooter').classList.remove('hidden');
    }

    else if (!username) {
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
        document.getElementById('globalFooter').classList.remove('hidden');
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
        var boardContent;

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
                newBoarder();
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

            // Board
            socket.on('boardControls', (option) => {
                if (option) {
                    setUpBoard();
                } else {
                    removeBoard();
                }
            })

            // Drawing Recieved
            socket.on('boardDrawn', (data) => {
                canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
            })

            // Board
            {
                var activeStroke = 1;
                var activeColor = 'rgb(0, 0, 0)';
                var activeZoom = 1;

                // Fabric
                var canvas = new fabric.Canvas('board-child', {isDrawingMode: true});
                canvas.backgroundColor = 'rgb(245, 245, 220)';

                // Clear Canvas
                document.getElementById('clear-board-btn').addEventListener('click', () => {
                    canvas.clear();
                })

                // Download Canvas
                document.getElementById('download-board-btn').addEventListener('click', () => {
                    var link = document.createElement('a');
                    link.id = 'downloadTemp';
                    link.download = 'Board.png';
                    link.href = document.getElementById('board-child').toDataURL();
                    link.click();
                    $('#downloadTemp').remove();
                })

                // Upload Image
                document.getElementById('upload-form').classList.add('hidden');

                document.getElementById('upload-board-btn').addEventListener ('click', () => {
                    if (document.getElementById('upload-form').classList.contains('hidden')) {
                        document.getElementById('upload-form').classList.remove('hidden');
                    } else {
                        document.getElementById('upload-form').classList.add('hidden');
                    }
                })

                document.getElementById('upload-form-close').addEventListener('click', () => {
                    document.getElementById('upload-form').classList.add('hidden');
                });

                document.getElementById('upload-btn').onchange = function handleImage(e) {
                    var reader = new FileReader();
                    reader.onload = function (event){
                        var imgObj = new Image();
                        imgObj.src = event.target.result;
                        imgObj.onload = function () {
                        var image = new fabric.Image(imgObj);
                        canvas.add(image);
                        canvas.renderAll();
                        enablePointer();
                        canvas.setActiveObject(image);
                        document.getElementById('upload-btn').value = '';
                        document.getElementById('upload-form').classList.add('hidden');
                        }
                    }
                    reader.readAsDataURL(e.target.files[0]);
                    }

                // Zoom In
                document.getElementById('zoom-in-board-btn').addEventListener('click', () => {
                    if (activeZoom >= 0.5) {
                        activeZoom += 0.5;
                    } else {
                        activeZoom *= 2;
                    }
                    canvas.setZoom(activeZoom);
                    document.getElementById('zoom-info').innerText = + activeZoom + 'x ';
                    canvas.setWidth(1500 * canvas.getZoom());
                    canvas.setHeight(3000 * canvas.getZoom());
                })

                // Zoom Out
                document.getElementById('zoom-out-board-btn').addEventListener('click', () => {
                    if (activeZoom > 0.5) {
                        activeZoom -= 0.5;
                    } else {
                        activeZoom /= 2;
                    }
                    canvas.setZoom(activeZoom);
                    document.getElementById('zoom-info').innerText = + activeZoom + 'x ';
                    canvas.setWidth(1500 * canvas.getZoom());
                    canvas.setHeight(3000 * canvas.getZoom());
                })

                // Zoom Info Click
                document.getElementById('zoom-info').addEventListener('click', () => {
                    activeZoom = 1;
                    canvas.setZoom(activeZoom);
                    document.getElementById('zoom-info').innerText = + activeZoom + 'x ';
                    canvas.setWidth(1500 * canvas.getZoom());
                    canvas.setHeight(3000 * canvas.getZoom());
                })

                // Color Picker
                function colorChange (data) {
                    activeColor = data;
                    document.getElementById('color-picker').style.backgroundColor = activeColor;
                    canvas.freeDrawingBrush.color = activeColor;
                    canvas.getActiveObjects().forEach((obj) => {
                        var objType = obj.get('type');
                        if (objType == 'path') {
                            obj.set({stroke: activeColor});
                            canvas.discardActiveObject().renderAll();
                        }
                        else if (objType == 'i-text') {
                            obj.setFill(activeColor);
                            obj.set({fill: activeColor, stroke: activeColor});
                            canvas.renderAll();
                        }
                        else {
                            obj.set({fill: activeColor, stroke: activeColor});
                            canvas.discardActiveObject().renderAll();
                        }
                    });
                }
                
                document.getElementById('colorpick-btn-board-black').addEventListener('click', () => {
                    colorChange('rgb(0, 0, 0)');
                })
                document.getElementById('colorpick-btn-board-red').addEventListener('click', () => {
                    colorChange('rgb(255, 0, 0)');
                })
                document.getElementById('colorpick-btn-board-blue').addEventListener('click', () => {
                    colorChange('rgb(102, 197, 235)');
                })
                document.getElementById('colorpick-btn-board-green').addEventListener('click', () => {
                    colorChange('rgb(97, 212, 97)');
                })
                document.getElementById('colorpick-btn-board-yellow').addEventListener('click', () => {
                    colorChange('rgb(231, 231, 87)');
                })

                // Adding Square
                document.getElementById('square-board-btn').addEventListener('click', () => {
                    var square = new fabric.Rect({
                        width:50,
                        height:50,
                        fill:activeColor,
                        stroke:activeColor,
                        strokeWidth:activeStroke,
                        top:50,
                        left:50
                    })
                    canvas.add(square);
                    enablePointer();
                    canvas.setActiveObject(square);
                })

                // Adding Circle
                document.getElementById('circle-board-btn').addEventListener('click', () => {
                    var circle = new fabric.Circle({
                        radius:25,
                        fill:activeColor,
                        stroke: activeColor,
                        strokeWidth:activeStroke,
                        top:50,
                        left:50
                    })
                    canvas.add(circle);
                    enablePointer();
                    canvas.setActiveObject(circle);
                })

                // Mouse Pointer
                function enablePointer () {
                    document.getElementById('tool-picker-logo').classList.remove('fa-pen');
                    document.getElementById('tool-picker-logo').classList.remove('fa-eraser');
                    document.getElementById('tool-picker-logo').classList.add('fa-mouse-pointer');
                    canvas.isDrawingMode = false;
                    document.getElementById('trash-erase-btn').classList.remove('hidden');
                }

                document.getElementById('pointer-board-btn').addEventListener('click', () => {
                    enablePointer();
                })

                // Pen
                function enableDrawing () {
                    document.getElementById('tool-picker-logo').classList.remove('fa-mouse-pointer');
                    document.getElementById('tool-picker-logo').classList.remove('fa-eraser');
                    document.getElementById('tool-picker-logo').classList.add('fa-pen');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush.color = activeColor;
                    document.getElementById('trash-erase-btn').classList.add('hidden');
                }
                
                document.getElementById('brush-board-btn').addEventListener('click', () => {
                    enableDrawing();
                })

                // Eraser
                function enableEraser () {
                    canvas.getActiveObjects().forEach((obj) => {
                        canvas.remove(obj)
                    });
                    canvas.discardActiveObject().renderAll();
                }
                document.getElementById('trash-erase-btn').addEventListener('click', () => {
                    enableEraser();
                })

                // Stroke
                function setStroke (data) {
                    activeStroke = data;
                    canvas.freeDrawingBrush.width = parseInt(activeStroke, 10) || 1;
                    canvas.getActiveObjects().forEach((obj) => {
                        canvas.getActiveObject().set({strokeWidth:activeStroke});
                        canvas.discardActiveObject().renderAll();
                    });
                }
                document.getElementById('stroke-setter-40').addEventListener('click', () => {
                    setStroke(40);
                })
                document.getElementById('stroke-setter-30').addEventListener('click', () => {
                    setStroke(30);
                })
                document.getElementById('stroke-setter-20').addEventListener('click', () => {
                    setStroke(20);
                })
                document.getElementById('stroke-setter-10').addEventListener('click', () => {
                    setStroke(10);
                })
                document.getElementById('stroke-setter-1').addEventListener('click', () => {
                    setStroke(1);
                })

                // Adding Text
                document.getElementById('text-board-btn').addEventListener('click', () => {
                    var text = new fabric.IText('Text', {
                        fontFamily:'Comic Sans',
                        stroke:activeColor,
                        fill:activeColor,
                        strokeWidth:1,
                        top:50,
                        left:50
                    });
                    canvas.add(text);
                    enablePointer();
                    canvas.setActiveObject(text);
                })

                document.getElementById('board').addEventListener('touchend', () => {
                    setTimeout(() => {
                        boardContent = JSON.stringify(canvas);
                        socket.emit('boardDrawn', {room: room, content: boardContent});
                    }, 10);
                })
                document.getElementById('board').addEventListener('mouseup', () => {
                    setTimeout(() => {
                        boardContent = JSON.stringify(canvas);
                        socket.emit('boardDrawn', {room: room, content: boardContent});
                    }, 10);
                })
            }
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

        // Send Chat Message
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
            pc[partnerName] = new RTCPeerConnection();
            
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
                    controlDiv.innerHTML = `<i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

                    // Create a new div for card
                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card';
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
                e.classList.add('text-danger');
                e.classList.remove('text-white');
            }

            else {
                e.setAttribute('title', 'Record');
                e.classList.add('text-white');
                e.classList.remove('text-danger');
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

        document.getElementById('chat-sender').addEventListener('click', () => {
            sendMsg(document.getElementById('chat-input').value);

            setTimeout(() => {
                document.getElementById('chat-input').value = '';
            }, 50);
        });

        // Whiteboard On/Off Controls
        document.getElementById('toggle-board').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('toggle-board').classList.toggle('bg-primary');
            if (document.getElementById('toggle-board').classList.contains('bg-primary')) {
                socket.emit('boardControls', {room: room, option: true});
                setUpBoard();
            } else {
                socket.emit('boardControls', {room: room, option: false});
                removeBoard();
            }
        });
        function setUpBoard () {
            document.getElementById('toggle-board').classList.add('bg-primary');
            document.getElementById('board').classList.remove('hidden');
            document.getElementById('videos').classList.remove('offBoard');
            document.getElementById('videos').classList.add('onBoard');
        }
        function removeBoard () {
            document.getElementById('toggle-board').classList.remove('bg-primary');
            document.getElementById('board').classList.add('hidden');
            document.getElementById('videos').classList.remove('onBoard');
            document.getElementById('videos').classList.add('offBoard');
        }
        function newBoarder () {
            if (document.getElementById('toggle-board').classList.contains('bg-primary')) {
                socket.emit('boardControls', {room: room, option: true});
                setUpBoard();
            } else {
                socket.emit('boardControls', {room: room, option: false});
                removeBoard();
            }
        }

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
                // h.toggleModal('recording-options-modal', true);
                document.getElementById('recording-options-modal').classList.toggle('hidden');
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