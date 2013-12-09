function buildMemberLists() {
    // XXX fixme: watch consistency between this and class/student edit transactions
    // if rows is nil, call the server.
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/?admin='+adminID+'&cmd=readmembers', false);
    xhr.setRequestHeader("Content-type","application/json");
    xhr.overrideMimeType("application/json"); 
    xhr.send(JSON.stringify({classID:classID}));
    var rowsets = JSON.parse(xhr.responseText);
    // Clear lists and rewrite
    var memberContainer = document.getElementById("members");
    var nonmemberContainer = document.getElementById("non-members");
    for (var i=0,ilen=memberContainer.childNodes.length;i<ilen;i+=1) {
        memberContainer.removeChild(memberContainer.childNodes[0]);
    }
    for (var i=0,ilen=nonmemberContainer.childNodes.length;i<ilen;i+=1) {
        nonmemberContainer.removeChild(nonmemberContainer.childNodes[0]);
    }
    for (var i=0,ilen=rowsets[1].length;i<ilen;i+=1) {
        var entry = document.createElement('div');
        var checkBox = document.createElement('input');
        checkBox.setAttribute('type', 'checkbox');
        checkBox.setAttribute('value', rowsets[1][i].id);
        entry.appendChild(checkBox);
        var entryText = document.createTextNode(rowsets[1][i].name);
        entry.appendChild(entryText);
        nonmemberContainer.appendChild(entry);
    }
}

function addMembers () {
    var nonMembers = document.getElementById('non-members');
    for (var i=0,ilen=nonMembers.childNodes.length;i<ilen;i+=1) {
        if (nonMembers.childNodes[i].childNodes[0].checked) {
            alert('Checked! '+nonMembers.childNodes[i].childNodes[0].value);
        }
    }
}
