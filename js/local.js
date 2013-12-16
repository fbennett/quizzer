function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function composeURL (classID, quizNumber, studentID, studentKey) {
}

function getPath () {
    var match = RegExp('https?://[^/]*/(.*)([?#]|$)').exec(window.location.href);
    return match && match[1];
}

function apiRequest (url, obj, returnAsString) {
    if ("object" === typeof obj) {
        obj = JSON.stringify(obj);
    } else if (!obj) {
        obj = null;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-type","text/plain");
    xhr.send(obj);
    var ret = xhr.responseText;
    if (!returnAsString) {
        ret = JSON.parse(ret);
    }
    return ret;
}
