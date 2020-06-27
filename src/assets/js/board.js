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
        console.log(JSON.stringify(canvas));
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
            console.log(objType);
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

    // Pen
    function enableDrawing () {
        document.getElementById('tool-picker-logo').classList.remove('fa-mouse-pointer');
        document.getElementById('tool-picker-logo').classList.remove('fa-eraser');
        document.getElementById('tool-picker-logo').classList.add('fa-pen');
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = activeColor;
        document.getElementById('trash-erase-btn').classList.add('hidden');
    }

    // Eraser
    function enableEraser () {
        canvas.getActiveObjects().forEach((obj) => {
            canvas.remove(obj)
        });
        canvas.discardActiveObject().renderAll();
    }

    // Stroke
    function setStroke (data) {
        activeStroke = data;
        canvas.freeDrawingBrush.width = parseInt(activeStroke, 10) || 1;
        canvas.getActiveObjects().forEach((obj) => {
            canvas.getActiveObject().set({strokeWidth:activeStroke});
            canvas.discardActiveObject().renderAll();
        });
    }

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