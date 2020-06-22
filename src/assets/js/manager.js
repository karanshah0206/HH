function copier (roomLink) {
    var dummy = document.createElement('input'),
                text = roomLink;
    document.body.appendChild(dummy);
    dummy.value = roomLink;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
}

function new_user (userInfo) {
    document.getElementById('new-user-manager').innerHTML += "<div class='new-user-join'> " + userInfo.username + " has joined the call</div>";
    fadeAction();
}

function goFull () {
    var elem = document.getElementById('superParent');
    if(window.innerHeight == screen.height) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    } else {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    }
}

window.addEventListener('resize', () => {
    if(window.innerHeight == screen.height) {
        document.getElementById('expand-btn').classList.add('hidden');
        document.getElementById('compress-btn').classList.remove('hidden');
    } else {
        document.getElementById('compress-btn').classList.add('hidden');
        document.getElementById('expand-btn').classList.remove('hidden');
    }
});

function fadeAction () {
    $(".new-user-join").fadeOut(5000, function() {
        $(this).remove();
    });
}
$(document).ready(function() {
    $("#videos").sortable();
    $("#videos").disableSelection();
    $("#local").draggable();
    $("#local").disableSelection();
});

window.addEventListener('load', () => {
    var today = new Date();
    document.getElementById('yearInsert').innerText = today.getFullYear();
})