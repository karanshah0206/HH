// Fabric
var canvas = new fabric.Canvas('board-child', {isDrawingMode: true});

document.getElementById('clear-board-btn').addEventListener('click', () => {
    canvas.clear();
})