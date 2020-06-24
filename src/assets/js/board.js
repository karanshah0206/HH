// Fabric
var canvas = new fabric.Canvas('board-child', {isDrawingMode: true});

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
    console.log(currentZoom);
})

// Zoom Out
document.getElementById('zoom-out-board-btn').addEventListener('click', () => {
    if (currentZoom > 0.5) {
        currentZoom -= 0.5;
    } else {
        currentZoom /= 2;
    }
    canvas.setZoom(currentZoom);
    console.log(currentZoom);
})