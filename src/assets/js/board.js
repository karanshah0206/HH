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

var currentZoom = 1;

// Zoom In
document.getElementById('zoom-in-board-btn').addEventListener('click', () => {
    if (currentZoom >= 0.5) {
        currentZoom += 0.5;
    } else {
        currentZoom *= 2;
    }
    canvas.setZoom(currentZoom);
    document.getElementById('zoom-info').innerText = + currentZoom + 'x ';
    canvas.setWidth(1500 * canvas.getZoom());
    canvas.setHeight(3000 * canvas.getZoom());
})

// Zoom Out
document.getElementById('zoom-out-board-btn').addEventListener('click', () => {
    if (currentZoom > 0.5) {
        currentZoom -= 0.5;
    } else {
        currentZoom /= 2;
    }
    canvas.setZoom(currentZoom);
    document.getElementById('zoom-info').innerText = + currentZoom + 'x ';
    canvas.setWidth(1500 * canvas.getZoom());
    canvas.setHeight(3000 * canvas.getZoom());
})

// Zoom Info Click
document.getElementById('zoom-info').addEventListener('click', () => {
    currentZoom = 1;
    canvas.setZoom(currentZoom);
    document.getElementById('zoom-info').innerText = + currentZoom + 'x ';
    canvas.setWidth(1500 * canvas.getZoom());
    canvas.setHeight(3000 * canvas.getZoom());
})

// Color Picker
var activeColor = 'rgb(0, 0, 0)';
function colorChange (data) {
    activeColor = data;
    document.getElementById('color-picker').style.backgroundColor = activeColor;
    canvas.freeDrawingBrush.color = activeColor;
    canvas.getActiveObjects().forEach((obj) => {
        var objType = canvas.getActiveObject().get('type');
        if (objType != 'path') {
            canvas.getActiveObject().set({fill: activeColor, stroke: activeColor});
            canvas.discardActiveObject().renderAll();
        } else {
            canvas.getActiveObject().set({stroke: activeColor});
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
        stroke: activeColor,
        top:50,
        left:50
    })
    canvas.add(square);
    enablePointer();
})

// Adding Circle
document.getElementById('circle-board-btn').addEventListener('click', () => {
    var circle = new fabric.Circle({
        radius:25,
        fill:activeColor,
        stroke: activeColor,
        top:50,
        left:50
    })
    canvas.add(circle);
    enablePointer();
})

// Mouse Pointer
function enablePointer () {
    document.getElementById('tool-picker').classList.remove('fa-pen');
    document.getElementById('tool-picker').classList.remove('fa-eraser');
    document.getElementById('tool-picker').classList.add('fa-mouse-pointer');
    canvas.isDrawingMode = false;
    document.getElementById('trash-erase-btn').classList.remove('hidden');
}

// Pen
function enableDrawing () {
    document.getElementById('tool-picker').classList.remove('fa-mouse-pointer');
    document.getElementById('tool-picker').classList.remove('fa-eraser');
    document.getElementById('tool-picker').classList.add('fa-pen');
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