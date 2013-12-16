function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function apiRequest (url, obj, returnAsString) {
    console.log('XXX >> '+url);
    if ("object" === typeof obj) {
        obj = JSON.stringify(obj);
    } else if (!obj) {
        obj = null;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-type","text/plain");
    xhr.send(obj);
    var ret;
    if (returnAsString) {
        ret = xhr.responseText;
    } else {
        ret = JSON.parse(xhr.responseText);
    }
    return ret;
}
