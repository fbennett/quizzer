function buildQuizList (rows) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    if (!rows) {
        // if rows is nil, call the server.
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=class'
                + '&cmd=readquizzes'
            , {
                classid:classID
            }
        );
    }
    rows.sort(function (a,b) {
        a = parseInt(a.number,10);
        b = parseInt(b.number,10);
        if (a>b) {
            return 1;
        } else if (a<b) {
            return -1;
        } else {
            return 0;
        }
    });
    // Delete children from container
    var container = document.getElementById('quiz-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var nameText = document.createTextNode("Quiz "+rows[i].number);
        var idText = document.createTextNode(rows[i].number);
        var tr = document.createElement('tr');
        var nameAnchor = document.createElement('a');
        var nameTD = document.createElement('td');
        var idTD = document.createElement('td');
        nameAnchor.appendChild(nameText);

        

        // XXX Think about this one.
        nameAnchor.setAttribute('href', fixPath('/?admin=' + adminID + '&page=quiz&classid=' + classID + '&quizno=' + rows[i].number));

        nameTD.appendChild(nameAnchor);
        tr.appendChild(nameTD);
        idTD.appendChild(idText);
        idTD.style.display = 'none';
        tr.appendChild(idTD)
        if (rows[i].isnew) {
            var newmarkText = document.createTextNode(' [new]');
            var newmarkTD = document.createElement('td');
            newmarkTD.appendChild(newmarkText);
            tr.appendChild(newmarkTD);
        }
        container.appendChild(tr);
    }
}


function buildMemberLists(rowsets) {
    if (!rowsets) {
        var adminID = getParameterByName('admin');
        var classID = getParameterByName('classid');
        rowsets = apiRequest(
            '/?admin='
                + adminID
                + '&page=class'
                + '&cmd=readmembers'
            , {
                classid:classID
            }
        );
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
            checkBox.setAttribute('value', rowsets[i][j].studentid);
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
    var rowsets = apiRequest(
        '/?admin='
            + adminID
            + '&page=class'
            + '&cmd=addmembers'
        , {
            classid:classID,
            addmembers:ret
        }
    );
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
    var rowsets = apiRequest(
        '/?admin='
            + adminID
            + '&page=class'
            + '&cmd=removemembers'
        , {
            classid:classID,
            removemembers:ret
        }
    );
    buildMemberLists(rowsets);
}

