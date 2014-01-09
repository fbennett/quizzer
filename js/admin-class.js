function showStragglers () {
    buttonMode('non-submitters-display');
};

function restoreMain () {
    buttonMode('main-display');
};

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
        if (false === rows) return;
    }
    console.log(JSON.stringify(rows,null,2));
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
    if (rows.length === 0) {
        rows = [{number:1,isnew:-1}];
    }
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var nameText;
        if (row.name) {
            nameText = document.createTextNode(row.name);
        } else {
            nameText = document.createTextNode("Quiz "+row.number);
        }
        var idText = document.createTextNode(row.number);
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
            var newmarkText;
            if (rows[i].isnew === -1) {
                newmarkText = document.createTextNode('[new]');
            } else {
                newmarkText = document.createTextNode('(' + rows[i].isnew + ')');
            }
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
        if (false === rowsets) return;
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
    if (false === rowsets) return;
    buildMemberLists(rowsets);
    buildQuizList();
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
    if (false === rowsets) return;
    buildMemberLists(rowsets);
    buildQuizList();
}

function setupExam () {
    buttonMode('create-exam');
};

function createExam () {
    var examTitle = document.getElementById('exam-title').value;
    var examDate = document.getElementById('exam-date').value;
    var examNumberOfQuestions = document.getElementById('exam-number-of-questions').value;
    if (!examTitle || !examDate || !examNumberOfQuestions) {
        buttonMode('default');
        return;
    } else {
        var adminID = getParameterByName('admin');
        var classID = getParameterByName('classid');
        var result = apiRequest(
            '/?admin='
                + adminID
                + '&page=class'
                + '&cmd=createexam'
            , {
                classid:classID,
                examtitle:examTitle,
                examdate:examDate,
                examnumberofquestions:examNumberOfQuestions
            }
        );
        if (false === result) return;
        
        buttonMode('default');
        //buildQuizList();
    }
};

function showNonSubmitters () {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var result = apiRequest(
        '/?admin='
            + adminID
            + '&page=class'
            + '&cmd=getnonsubmitters'
        , {
            classid:classID
        }
    );
    if (false === result) return;
    
    var nonSubmittersList = document.getElementById('non-submitters-list');
    for (var i=0,ilen=nonSubmittersList.childNodes.length;i<ilen;i+=1) {
        nonSubmittersList.removeChild(nonSubmittersList.childNodes[0]);
    }
    var colspec = ['name','quizzes','email'];
    for (var i=0,ilen=result.length;i<ilen;i+=1) {
        var nonsubTR = document.createElement('tr');
        if (i % 2) {
            nonsubTR.setAttribute('class','even');
        } else {
            nonsubTR.setAttribute('class','odd');
        }
        var line = result[i];
        for (var j=0,jlen=3;j<jlen;j+=1) {
            var node = document.createElement('td');
            if (j === 2) {
                node.setAttribute('class', 'email');
            }
            node.innerHTML = line[colspec[j]];
            nonsubTR.appendChild(node);
        }
        nonSubmittersList.appendChild(nonsubTR);
    }
};

function buttonMode (mode) {
    var setupButton = document.getElementById('exam-setup');
    var createButton = document.getElementById('exam-create');
    var examBoxes = document.getElementById('exam-boxes');

    var mainDisplayButton = document.getElementById('main-display-button');
    var mainDisplay = document.getElementsByClassName('main-display');

    var nonSubmittersButton = document.getElementById('non-submitters-button');
    var nonSubmittersDisplay = document.getElementsByClassName('non-submitters-display');

    if (mode === 'create-exam') {
        setupButton.style.display = "none";
        createButton.style.display = "inline";
        examBoxes.style.display = "inline";
        nonSubmittersButton.style.display = 'none';
    } else if (mode === 'non-submitters-display') {
        setupButton.style.display = 'none';
        setupButton.disabled = true;
        createButton.style.display = 'none';
        examBoxes.style.display = 'none';
        mainDisplayButton.style.display = 'inline';
        for (var i=0,ilen=mainDisplay.length;i<ilen;i+=1) {
            mainDisplay[i].style.display = 'none';
        }
        for (var i=0,ilen=nonSubmittersDisplay.length;i<ilen;i+=1) {
            nonSubmittersDisplay[i].style.display = 'block';
        }
        nonSubmittersButton.style.display = 'none';
        showNonSubmitters();
    } else if (mode === 'main-display') {
        setupButton.style.display = 'inline';
        setupButton.disabled = false;
        createButton.style.display = 'none';
        examBoxes.style.display = 'none';
        mainDisplayButton.style.display = 'none';
        for (var i=0,ilen=mainDisplay.length;i<ilen;i+=1) {
            mainDisplay[i].style.display = 'block';
        }
        for (var i=0,ilen=nonSubmittersDisplay.length;i<ilen;i+=1) {
            nonSubmittersDisplay[i].style.display = 'none';
        }
        nonSubmittersButton.style.display = 'inline';
    } else {
        setupButton.style.display = "inline";
        createButton.style.display = "none";
        examBoxes.style.display = "none";
        document.getElementById('exam-title').value = '';
        document.getElementById('exam-date').value = '';
        document.getElementById('exam-number-of-questions').value = '';
        nonSubmittersButton.style.display = 'inline';
    }
}

function setUploadURL () {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var uploadURL = fixPath(
        '?admin='
            + adminID
            + '&page=class'
            + '&cmd=uploadstudentlist'
            + '&classid='
            + classID
    );
    var classRegistrationWidget = document.getElementById('class-registration-widget');
    classRegistrationWidget.setAttribute('action',uploadURL);
};
