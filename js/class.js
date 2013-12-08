function buildNonMemberList(classID) {
    // XXX fixme: watch consistency between this and class/student edit transactions
    if (!rows) {
        // if rows is nil, call the server.
        var adminID = getParameterByName('admin');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/?admin='+adminID+'&cmd=readnonmembers', false);
        xhr.setRequestHeader("Content-type","application/json");
        xhr.overrideMimeType("application/json"); 
        xhr.send(JSON.stringify({classID:classID}));
        var obj = JSON.parse(xhr.responseText);

        // rows? object?
    }
    
}
