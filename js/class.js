function buildMemberLists(rowsets) {
    if (!rowsets) {
        var adminID = getParameterByName('admin');
        var classID = getParameterByName('classid');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/?admin='+adminID+'&cmd=readmembers', false);
        xhr.setRequestHeader("Content-type","application/json");
        xhr.overrideMimeType("application/json"); 
        xhr.send(JSON.stringify({classID:classID}));
        rowsets = JSON.parse(xhr.responseText);
    }
    // Clear lists and rewrite
    var memberContainer = document.getElementById("members");
    var nonmemberContainer = document.getElementById("non-members");
    var listContainers = [memberContainer, nonmemberContainer];
    for (var i=0,ilen=listContainers.length;i<ilen;i+=1) {
        rowsets[i].sort(function (a,b) {
            return a.name.localeCompare(b.name);
        });
        for (var j=0,jlen=listContainers[i].childNodes.length;j<jlen;j+=1) {
            listContainers[i].removeChild(listContainers[i].childNodes[0]);
        }
        for (var j=0,jlen=rowsets[i].length;j<jlen;j+=1) {
            var entry = document.createElement('div');
            var checkBox = document.createElement('input');
            checkBox.setAttribute('type', 'checkbox');
            checkBox.setAttribute('value', rowsets[i][j].id);
            entry.appendChild(checkBox);
            var entryText = document.createTextNode(rowsets[i][j].name);
            entry.appendChild(entryText);
            listContainers[i].appendChild(entry);
        }
    }
}

function addMembers () {
    var ret = [];
    var nonMembers = document.getElementById('non-members');
    for (var i=0,ilen=nonMembers.childNodes.length;i<ilen;i+=1) {
        if (nonMembers.childNodes[i].childNodes[0].checked) {
            ret.push(nonMembers.childNodes[i].childNodes[0].value);
        }
    }
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/?admin='+adminID+'&cmd=addmembers', false);
    xhr.setRequestHeader("Content-type","application/json");
    xhr.overrideMimeType("application/json"); 
    xhr.send(JSON.stringify({classID:classID,addmembers:ret}));
    var rowsets = JSON.parse(xhr.responseText);
    buildMemberLists(rowsets);
}

function removeMembers () {
    var ret = [];
    var members = document.getElementById('members');
    for (var i=0,ilen=members.childNodes.length;i<ilen;i+=1) {
        if (members.childNodes[i].childNodes[0].checked) {
            ret.push(members.childNodes[i].childNodes[0].value);
        }
    }
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/?admin='+adminID+'&cmd=removemembers', false);
    xhr.setRequestHeader("Content-type","application/json");
    xhr.overrideMimeType("application/json"); 
    xhr.send(JSON.stringify({classID:classID,removemembers:ret}));
    var rowsets = JSON.parse(xhr.responseText);
    buildMemberLists(rowsets);
}
