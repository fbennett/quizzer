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
            if (i === 1) {
                entry.setAttribute("class","non-member-entry");
                entry.innerHTML = '<div class="non-member-del-button"><input type="button" value="Del" class="button-small i18n" name="value-delete" onclick="confirmDelete(this,\'executeNonMemberRemoval\');"/></div>'
            }
            var checkBox = document.createElement('input');
            checkBox.setAttribute('type', 'checkbox');
            checkBox.setAttribute('value', rowsets[i][j].studentid);
            entry.appendChild(checkBox);
            var entryText = document.createElement('span');
            entryText.innerHTML = rowsets[i][j].name;
            if (rowsets[i][j].privacy > 0) {
                entryText.classList.add('external-member');
            }
            entry.appendChild(entryText);
            listContainers[i].appendChild(entry);
        }
    }
}

function executeNonMemberRemoval (node) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var studentID = node.parentNode.nextSibling.value;
    var ignore = apiRequest(
        '/?admin='
            + adminID
            + '&page=class'
            + '&cmd=removenonmember'
        , {
            classid:classID,
            studentid:studentID
        }
    );
    buildMemberLists();
}

function addMembers () {
    var ret = [];
    var nonMembers = document.getElementById('non-members');
    for (var i=0,ilen=nonMembers.childNodes.length;i<ilen;i+=1) {
        if (nonMembers.childNodes[i].childNodes[1].checked) {
            ret.push(nonMembers.childNodes[i].childNodes[1].value);
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
        buildQuizList();
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

function showProfile () {
    generateProfileChart();
    buttonMode('profile-display');
}

function generateProfileChart() {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var graphData = apiRequest(
        '/?admin='
            + adminID
            + '&page=class'
            + '&cmd=getprofiledata'
        , {
            classid:classID
        }
    );
    if (false === graphData) return;


    // Okay, let's get it straight this time.
    //
    // We will return values as percentages of the class in each of the five quintiles.
    //
    // Split it into two halves, early and late.
    var midPoint = ~~(graphData.length/2);
    var slicePos = [[0,midPoint],[midPoint,graphData.length]];
    var responderTotal = [0,0];
    var cohortNormalizationFactor = [1,1];
    var quintileDataSets = [];
    var respondingIDs = {};
    var numbers = [];
    for (var i=0,ilen=2;i<ilen;i++) {
        //
        // For each half ...
        var rawdata = graphData.slice(slicePos[i][0],slicePos[i][1]);
        // Get total questions answered and total correct for each student
        var dataByStudent = {};
        var maxAnswers = 0;
        var studentID;
        for (var j=0,jlen=rawdata.length;j<jlen;j+=1) {
            studentID = rawdata[j].studentID;
            var correct = rawdata[j].correct;
            if (!dataByStudent[studentID]) {
                dataByStudent[studentID] = {
                    answers:0,
                    correct:0
                };
                responderTotal[i] += 1;
                respondingIDs[studentID] = true;
            }
            dataByStudent[studentID].answers += 1;
            if (correct) {
                dataByStudent[studentID].correct += 1;
            }
            // Watch for the max
            if (dataByStudent[studentID].answers > maxAnswers) {
                maxAnswers = dataByStudent[studentID].answers;
            }
        }
        for (var studentID in dataByStudent) {
            var studentData = dataByStudent[studentID];
            // Get the overall percentage of correct answers for each student.
            studentData.percentage = (studentData.correct*100/studentData.answers);
            // Calculate a weight for each student by total questions answered (highest responder = 1.0)
            studentData.weight = (studentData.answers/maxAnswers);
        }
        // Divide into quintile groups
        var quintileData = {0:[],1:[],2:[],3:[],4:[]};
        for (studentID in dataByStudent) {
            var student = dataByStudent[studentID];
            if (student.percentage === 100) {
                // Otherwise 100% correct snaps to zero
                student.percentage = 99;
            }
            var quintpos = parseInt((student.percentage/20) % 5,10);
            quintileData[quintpos].push(student);
        }
        quintileDataSets.push(quintileData);
    }
    // Get total number of responders
    studentCount = 0;
    for (var id in respondingIDs) {
        studentCount += 1;
    }
    // Set cohort normalization factor
    var curvename;
    var normfactor = 0;
    if (responderTotal[0] > responderTotal[1]) {
        cohortNormalizationFactor[1] = responderTotal[0]/responderTotal[1];
        curvename = 'unshaded';
        normfactor = cohortNormalizationFactor[1];
    } else if (responderTotal[0] < responderTotal[1]) {
        cohortNormalizationFactor[0] = responderTotal[1]/responderTotal[0];
        curvename = 'shaded';
        normfactor = cohortNormalizationFactor[0];
    }
    for (var i=0,ilen=2;i<ilen;i++) {
        var quintileData = quintileDataSets[i];
        // Take a *weighted* total of the students in each quintile, to avoid distortions from low-frequency responders.
        numbers[i] = [{x:0,y:0}];
        for (var j=0,jlen=5;j<jlen;j++) {
            var quintData = quintileData[j];
            var quint = {
                x:((20*j)+10),
                y:0
            };
            for (var k=0,klen=quintData.length;k<klen;k++) {
                // Unweighted return
                //quint.y += 1;
                // Weighted by response rate within cohort
                //quint.y += quintData[k].weight;
                // Normalized, unweighted
                quint.y += cohortNormalizationFactor[i];
                // Normalized, weighted
                //quint.y += (quintData[k].weight * cohortNormalizationFactor[i]);
            }
            numbers[i].push(quint);
        }
        numbers[i].push({x:100,y:0});
    }
    var data = {
        xScale: 'linear',
        yScale: 'linear',
        type: 'line-dotted',
        main: [
            {
                className: '.pizza',
                data: numbers[0]
            }
        ],
        comp: [
            {
                className: '.pizza',
                type: 'line-dotted',
                data: numbers[1]
            }
        ]
    }
    var opts = {};
    var myChart = new xChart('line', data, '#profile-chart', opts);
    var curveName = document.getElementById('curvename');
    curveName.innerHTML = curvename;
    var firstHalfRate = document.getElementById('first-half-rate');
    firstHalfRate.innerHTML = parseInt(responderTotal[0]*100/studentCount,10);
    var secondHalfRate = document.getElementById('second-half-rate');
    secondHalfRate.innerHTML = parseInt(responderTotal[1]*100/studentCount,10);
    if (normfactor) {
        var useNormFactor = document.getElementById('use-normfactor');
        useNormFactor.style.display = 'inline';
        var normFactor = document.getElementById('normfactor');
        normFactor.innerHTML = parseInt(((normfactor-1)*100),10);
    }
}

function buttonMode (mode) {
    var setupButton = document.getElementById('exam-setup');
    var createButton = document.getElementById('exam-create');
    var examBoxes = document.getElementById('exam-boxes');

    var mainDisplayButton = document.getElementById('main-display-button');

    var nonSubmittersButton = document.getElementById('non-submitters-button');
    var nonSubmittersDisplay = document.getElementsByClassName('non-submitters-display');

    var profileButton = document.getElementById('class-profile-button');

    if (mode === 'create-exam') {
        setupButton.style.display = "none";
        createButton.style.display = "inline";
        examBoxes.style.display = "inline";
        nonSubmittersButton.style.display = 'none';
        profileButton.style.display = 'none';
    } else if (mode === 'non-submitters-display') {
        setupButton.style.display = 'none';
        setupButton.disabled = true;
        createButton.style.display = 'none';
        examBoxes.style.display = 'none';
        mainDisplayButton.style.display = 'inline';
        hideRevealMainDisplay('none');
        for (var i=0,ilen=nonSubmittersDisplay.length;i<ilen;i+=1) {
            nonSubmittersDisplay[i].style.display = 'block';
        }
        profileButton.style.display = 'none';
        nonSubmittersButton.style.display = 'none';
        showNonSubmitters();
    } else if (mode === 'profile-display') {
        mainDisplayButton.style.display = 'inline';
        nonSubmittersButton.style.display = 'none';
        profileButton.style.display = 'none';
        setupButton.style.display = "none";
        hideRevealMainDisplay('none');
        hideRevealProfileDisplay('block');
    } else if (mode === 'main-display') {
        setupButton.style.display = 'inline';
        setupButton.disabled = false;
        createButton.style.display = 'none';
        hideRevealProfileDisplay('none');
        examBoxes.style.display = 'none';
        mainDisplayButton.style.display = 'none';
        hideRevealMainDisplay('block');
        for (var i=0,ilen=nonSubmittersDisplay.length;i<ilen;i+=1) {
            nonSubmittersDisplay[i].style.display = 'none';
        }
        nonSubmittersButton.style.display = 'inline';
        profileButton.style.display = 'inline';
    } else {
        setupButton.style.display = "inline";
        createButton.style.display = "none";
        examBoxes.style.display = "none";
        document.getElementById('exam-title').value = '';
        document.getElementById('exam-date').value = '';
        document.getElementById('exam-number-of-questions').value = '';
        nonSubmittersButton.style.display = 'inline';
        profileButton.style.display = 'inline';
    }
}

function hideRevealMainDisplay (arg) {
    var mainDisplay = document.getElementsByClassName('main-display');
    for (var i=0,ilen=mainDisplay.length;i<ilen;i+=1) {
        mainDisplay[i].style.display = arg;
    }
}

function hideRevealProfileDisplay (arg) {
    var profileDisplay = document.getElementsByClassName('class-profile-display');
    for (var i=0,ilen=profileDisplay.length;i<ilen;i+=1) {
        profileDisplay[i].style.display = arg;
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

function downloadClassList () {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var downloadFrame = document.getElementById('download-frame');
    downloadFrame.src = fixPath('?admin='
                                + adminID
                                + '&page=class'
                                + '&cmd=downloadcsv'
                                + '&classid='
                                + classID);
};

