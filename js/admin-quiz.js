var qzi = {};
function markExam () {
    console.log("markExam()");
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    // Call server and get an object with the correct answers
    var result = apiRequest(
        '/?admin='
            + adminID
            + '&page=quiz'
            + '&cmd=getcorrectanswers'
        , {
            classid:classID,
            quizno:quizNumber
        });
    if (false === result) return;
    qzi.correctAnswers = result.correctAnswers;
    qzi.studentNames = result.studentNames;
    qzi.serverResults = result.serverResults;
    qzi.numberOfStudents = result.numberOfStudents;
    qzi.numberOfQuestions = result.numberOfQuestions;
    qzi.clientResult = {};
    qzi.currentStudentID = false;
    setDisplayMode('marking');
    clearMarksheet();
    var inputNode = document.getElementById('string-input');
    inputNode.setAttribute('onkeypress','keystrokeHandler(event);');
    inputNode.focus();
};

function keystrokeHandler(event) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var inputNode = document.getElementById('string-input');
    var inputVal = '';
    if (event.key === 'Enter') {
        // alert(inputNode.value);
        // Capture entry
        var ans = {};
        var inputVal = inputNode.value;
        inputNode.value = '';
        inputVal = inputVal.replace(/^0*/,'');
        var studentOffset = parseInt(inputVal.slice(0,1),10);
        var questionOffset = parseInt(inputVal.slice(1,2),10);
        ans.studentID = inputVal.slice(2,2+studentOffset);
        ans.questionNumber = inputVal.slice(2+studentOffset,2+studentOffset+questionOffset);
        ans.choice = inputVal.slice(2+studentOffset+questionOffset,2+studentOffset+questionOffset+1);
        checkAlreadyDone(ans);
    }
};

function checkAlreadyDone(ans) {
    console.log("checkAlreadyDone()");
    clearError();
    // Is this student already done?
    if (qzi.serverResults[ans.studentID]) {
        showError([qzi.studentNames[ans.studentID] + ' is already done']);
    } else {
        checkIncomplete(ans);
    }
};

function checkIncomplete(ans) {
    console.log("checkIncomplete()");
    // If there was a previous exam, is it complete?
    if (qzi.currentStudentID && qzi.currentStudentID != ans.studentID) {
        showError(['Answers for ' + qzi.studentNames[ans.studentID] + ' are not yet complete']);
    } else {
        qzi.currentStudentID = ans.studentID;
        var studentName = document.getElementById('student-name');
        studentName.innerHTML = qzi.studentNames[ans.studentID];
        checkAlreadyAnswered(ans);
    }
};

function checkAlreadyAnswered(ans) {
    // Does this answer conflict? If so, it's an error
    console.log("checkAlreadyAnswered()");
    if ("undefined" !== typeof qzi.clientResult[ans.questionNumber]) {
        showError(['Question ' + ans.questionNumber + ' is already done.',
                  'Deleting both responses, please try again.']);
        delete qzi.clientResult[ans.questionNumber];
        showAnswers();
    } else {
        recordAnswer(ans);
    }
};

function recordAnswer (ans) {
    console.log("recordAnswer()");
    qzi.clientResult[ans.questionNumber] = ans.choice;
    showAnswers();
    checkExamComplete(ans);
};

function checkExamComplete(ans) {
    // Is the exam complete?
    console.log("checkExamComplete()");
    var numberOfAnswers = 0;
    for (var key in qzi.clientResult) {
        numberOfAnswers += 1;
    }
    if (qzi.numberOfQuestions === numberOfAnswers) {
        recordExamResult(ans);
    }
};

function recordExamResult(ans) {
    console.log("recordExamResult()");
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    // Fire and forget
    var ignore = apiRequest(
        '/?admin='
            + adminID
            + '&page=quiz'
            + '&cmd=recordexamresult'
        , {
            classid:classID,
            quizno:quizNumber,
            studentid:qzi.currentStudentID,
            answers:qzi.clientResult
        });
    if (false === ignore) return;
    qzi.serverResults[ans.studentID] = qzi.clientResult;
    qzi.clientResult = {};
    qzi.currentStudentID = false;
    updateStudentsComplete();
};

function updateStudentsComplete() {
    clearMarksheet();
    checkExamsComplete();
};

function checkExamsComplete() {
    console.log("checkExamsComplete()");
    // Are there no more exams to process?
    var numberOfStudents = 0;
    for (var key in qzi.serverResults) {
        numberOfStudents += 1;
    }
    if (qzi.numberOfStudents === numberOfStudents) {
        setButtonState('exam-results');
        buildQuestionList();
        //setDisplayMode('marking');
    }
};

function showError (lst) {
    console.log("showError(): "+lst);
    var showErrors = document.getElementById('show-errors');
    for (var i=0,ilen=showErrors.childNodes.length;i<ilen;i+=1) {
        showErrors.removeChild(showErrors.childNodes[0]);
    }
    showErrors.style.visibility = 'visible';
    for (var i=0,ilen=lst.length;i<ilen;i+=1) {
        var node = document.createElement('div');
        node.innerHTML = lst[i];
        showErrors.appendChild(node);
    }
};

function clearError () {
    var showErrors = document.getElementById('show-errors');
    for (var i=0,ilen=showErrors.childNodes.length;i<ilen;i+=1) {
        showErrors.removeChild(showErrors.childNodes[0]);
    }
    var placeholder = document.createElement('div');
    placeholder.innerHTML = '&nbsp;';
    showErrors.appendChild(placeholder);
    showErrors.style.visibility = 'hidden';    
};

function showAnswers () {
    console.log("showAnswers()");
    var column = {};
    var questionCol = {};
    var questionNumbers = [];
    for (var questionNumber in qzi.correctAnswers) {
        questionNumbers.push(parseInt(questionNumber,10));
    }
    questionNumbers.sort(function(a,b){if(a>b){return 1}else if(a<b){return -1}else{return 0}});
    // round up
    var segLen = parseInt(questionNumbers.length/3)+1;
    for (var i=1,ilen=4;i<ilen;i+=1) {
        // Set column splits
        var segStart = segLen * (i-1);
        var segEnd = segLen * i;
        var seg = questionNumbers.slice(segStart,segEnd);
        for (var j=0,jlen=seg.length;j<jlen;j+=1) {
            questionCol[seg[j]] = i;
        }
        // Clear the columns
        column[i] = document.getElementById('answer-column-' + i);
        for (var j=0,jlen=column[i].childNodes.length;j<jlen;j+=1) {
            column[i].removeChild(column[i].childNodes[0]);
        }
    }
    // Write available results to columns
    var myQuestionNumbers = [];
    for (var questionNumber in qzi.clientResult) {
        myQuestionNumbers.push(parseInt(questionNumber,10));
    }
    myQuestionNumbers.sort(function(a,b){if(a>b){return 1}else if(a<b){return -1}else{return 0}});
    for (var i=0,ilen=myQuestionNumbers.length;i<ilen;i+=1) {
        var questionLabel = 'Question ' + myQuestionNumbers[i];
        var rightWrong = document.createElement('span');
        if (qzi.clientResult[myQuestionNumbers[i]] == qzi.correctAnswers[myQuestionNumbers[i]]) {
            rightWrong.innerHTML = '\u25ef';
            rightWrong.setAttribute('style','color:green;text-weight:bold;')
        } else {
            rightWrong.innerHTML = '\u00d7';
            rightWrong.setAttribute('style', 'color:red;font-size:larger;');
        }
        var tRow = document.createElement('tr');
        var tLabel = document.createElement('td');
        tLabel.innerHTML = questionLabel;
        var tResult = document.createElement('td');
        tResult.appendChild(rightWrong);
        tRow.appendChild(tLabel);
        tRow.appendChild(tResult);
        var container = column[questionCol[myQuestionNumbers[i]]];
        container.appendChild(tRow);
    }
};

function clearMarksheet () {
    var cols = [];
    for (var i=1,ilen=4;i<ilen;i+=1) {
        var col = document.getElementById('answer-column-' + i);
        for (var j=0,jlen=col.childNodes.length;j<jlen;j+=1) {
            col.removeChild(col.childNodes[0]);
        }
    }
    var studentName = document.getElementById('student-name');
    studentName.innerHTML = '???';
    showStudents();
};

function showStudents () {
    console.log("showStudents()");
    var studentList = document.getElementById("student-list");
    for (var i=0,ilen=studentList.childNodes.length;i<ilen;i+=1) {
        studentList.removeChild(studentList.childNodes[0]);
    }
    // Sort in descending order of score
    var lst = [];
    for (var studentID in qzi.serverResults) {
        var score = 0;
        for (var questionNumber in qzi.serverResults[studentID]) {
            if (qzi.correctAnswers[questionNumber] == qzi.serverResults[studentID][questionNumber]) {
                score += 1;
            }
        }
        var obj = {
            studentID:studentID,
            score:score
        }
        lst.push(obj);
    }
    lst.sort(
        function (a,b) {
            if (a.score>b.score) {
                return -11;
            } else if (a.score<b.score) {
                return 1;
            } else {
                return 0;
            }
        }
    );
    // Display
    for (var i=0,ilen=lst.length;i<ilen;i+=1) {
        var obj = lst[i];
        var studentTR = document.createElement('tr');
        studentTR.innerHTML = '<td><b>' + qzi.studentNames[obj.studentID] + '</b></td>'
            + '<td style="text-align:right;">(' + obj.score + '/' + qzi.numberOfQuestions + ')</td>';
        studentList.appendChild(studentTR);
    }
};

function downloadExam () {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var downloadFrame = document.getElementById('download-frame');
    downloadFrame.src = fixPath('?admin='
                                + adminID
                                + '&page=quiz'
                                + '&cmd=downloadexam'
                                + '&classid='
                                + classID
                                + '&quizno='
                                + quizNumber);
    setButtonState('mark-exam');
};

function buildQuestionList (quizobj) {
    console.log("buildQuestionList()");
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');

    var inputNode = document.getElementById('string-input');
    inputNode.setAttribute('onkeypress','keystrokeHandler(event);');
    inputNode.blur();

    // Call for quiz questions
    if (!quizobj) {
        // if rows is nil, call the server.
        var quizobj = apiRequest(
            '/?admin='
                + adminID
                + '&page=quiz'
                + '&cmd=readquestions'
            , {
                classid:classID,
                quizno:quizNumber
            });
        if (false === quizobj) return;
    }
    console.log("RETURN: "+JSON.stringify(quizobj,null,2));
    qzi.pending = quizobj.pending;
    var questionsLst = displayQuestions(quizobj.questions);
    var button = document.getElementById('add-question-button');
    button.disabled = false;
    if (quizobj.examName) {
        setButtonState('download-exam',questionsLst);
    } else {
        setButtonState('send-quiz',questionsLst);
    }
}

function enableEditing () {
    var buttons = document.getElementsByClassName('editing-button');
    for (var i=0,ilen=buttons.length;i<ilen;i+=1) {
        buttons[i].style.display = 'inline';
        buttons[i].disabled = false;
    }
};

function disableEditing () {
    var buttons = document.getElementsByClassName('editing-button');
    for (var i=0,ilen=buttons.length;i<ilen;i+=1) {
        buttons[i].style.display = 'none';
    }
    var radios = document.getElementsByClassName('selection');
    for (var i=0,ilen=radios.length;i<ilen;i+=1) {
        var radio = radios[i];
        if (radio.tagName.toLowerCase() == "input") {
            var marker = document.createElement('span');
            marker.setAttribute('class','selection');
            if (radio.checked) {
                marker.innerHTML = '\u25ef';
                marker.setAttribute('style','color:green;text-weight:bold;')
            } else {
                //marker.innerHTML = '\u274c';
                marker.innerHTML = '\u00d7';
                marker.setAttribute('style', 'color:red;');
            }
            radio.parentNode.insertBefore(marker,radio);
            radio.parentNode.removeChild(radio);
        }
    }
};

function sendQuiz() {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');

    var emptystr = apiRequest(
        '/?admin='
            + adminID
            + '&page=quiz'
            + '&cmd=sendquiz'
        , {
            classid:classID,
            quizno:quizNumber
        });
    setButtonState('quiz-done');
}

function writeChoice(questionNumber, choice) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');

    var emptystr = apiRequest(
        '/?admin='
            + adminID 
            + '&page=quiz'
            + '&cmd=writeonechoice'
        , {
            classid:classID,
            quizno:quizNumber,
            questionno:questionNumber,
            choice:choice
        }
    );
}

function addQuestion () {
    // Add a question node and populate using openQuestion()
    var questions = document.getElementById('quiz-questions');
    questions.insertBefore(openQuestion(),questions.firstChild);
    questions.lastChild.firstChild.firstChild.focus();
    var button = document.getElementById('add-question-button');
    button.disabled = true;
}

function openQuestion (questionNumber) {

    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');

    if (!questionNumber) {
        questionNumber = 0;
    }
    var qobj = {};
    var node;
    if (questionNumber) {
        // If questionNumber present, call for JSON of question from server
        // (to get markdown)
        qobj = apiRequest(
            '/?admin='
                + adminID
                + '&page=quiz'
                + '&cmd=readonequestion'
            , {
                classid:classID,
                quizno:quizNumber,
                questionno:questionNumber
            }
        );
        if (false === qobj) return;
        // ... empty this child ...
        node = document.getElementById('quiz-question-' + questionNumber);
        for (var i=0,ilen=node.childNodes.length;i<ilen;i+=1) {
            node.removeChild(node.childNodes[0]);
        }
        // ... and fill with saved data.
        
    } else {
        // Otherwise, create empty object
        qobj = {
            rubric: "",
            questions: ["", "", "", ""],
            correct: 3
        }
        node = document.createElement('li');
        node.setAttribute('id', 'quiz-question-' + questionNumber);
    }
    var rubric = document.createElement('div');
    rubric.setAttribute("class", "rubric");
    rubric.innerHTML = '<textarea tabindex="1" style="vertical-align:top;" placeholder="Enter rubric here" cols="70" rows="3">'
        + qobj.rubric
        + '</textarea>'
        + '<input type="button" value="Standard" onclick="standardRubric(' + questionNumber + ');" class="button"/>'
    node.appendChild(rubric);

    for (var i=0,ilen=qobj.questions.length;i<ilen;i+=1) {
        var cw = document.createElement('div');
        cw.setAttribute('class', 'choice');
        var checked = ''
        if (qobj.correct === i) {
            checked = 'checked="true" '
        }
        var buttonAttrs = ''
        if (i === 0) {
            buttonAttrs = 'value="Copy to all" onclick="copyToAll(' + questionNumber + ')" class="button"'
        } else {
            buttonAttrs = 'value="Ditto" onclick="dittoPrevious(' + questionNumber + ',' + i + ')" class="button"'
        }
        cw.innerHTML = '<input type="radio" class="selection" ' 
            + checked
            + 'name="question-' + questionNumber + '" '
            + '/>'
            + '<textarea tabindex="' + (i+2) + '" cols="60" rows="3" class="selection-text" placeholder="Enter choice here">'
            + qobj.questions[i]
            + '</textarea>'
            + '<input type="button" ' + buttonAttrs+ '/>';
        node.appendChild(cw);
    }
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', 'Save Question');
    if (questionNumber) {
        button.setAttribute('onclick', 'closeQuestion("' + questionNumber + '")');
    } else {
        button.setAttribute('onclick', 'closeQuestion("' + questionNumber + '",true)');
    }
    button.setAttribute('class', 'button');
    button.setAttribute('tabindex', '6');
    node.appendChild(button);
    return node;
}

function standardRubric (questionNumber) {
    var node = document.getElementById('quiz-question-' + questionNumber);
    if (!node.childNodes[0].childNodes[0].value) {
        node.childNodes[0].childNodes[0].value = "Which of the following is correct?";
    }
}

function copyToAll (questionNumber) {
    var node = document.getElementById('quiz-question-' + questionNumber);
    if (node.childNodes[1].childNodes[1].value) {
        var val = node.childNodes[1].childNodes[1].value;
        for (var i=2,ilen=5;i<ilen;i+=1) {
            if (!node.childNodes[i].childNodes[1].value) {
                node.childNodes[i].childNodes[1].value = val;
            }
        }
    }
}

function dittoPrevious (questionNumber, choice) {
    var node = document.getElementById('quiz-question-' + questionNumber);
    var prev = node.childNodes[choice].childNodes[1];
    var current = node.childNodes[1 + choice].childNodes[1];
    if (prev.value && !current.value) {
        current.value = prev.value;
    }
}

function closeQuestion (questionNumber, moveToBottom) {

    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');

    // Extracts text-box content to object
    var node = document.getElementById('quiz-question-' + questionNumber);
    var rubric = node.childNodes[0].childNodes[0].value;
    var abort = false;
    if (!rubric) {
        abort = true;
        alert("Rubric is empty. All fields must have content.");
    }
    var correct = 0;
    var questions = [];
    for (var i=1,ilen=node.childNodes.length - 1;i<ilen;i+=1) {
        if (node.childNodes[i].childNodes[0].checked) {
            correct = (i-1);
        }
        var content = node.childNodes[i].childNodes[1].value;
        if (!content && !abort) {
            abort = true;
            alert("Choice " + i + " is empty. All fields must have content.");
        }
        questions.push(content);
    }
    if (abort) return;
    var obj = {
        rubric: rubric,
        questions: questions,
        correct: correct
    }
    // Sends object to server for saving
    var questionNumber = apiRequest(
        '/?admin=' 
            + adminID 
            + '&page=quiz'
            + '&cmd=writeonequestion'
        , {
            classid:classID,
            quizno:quizNumber,
            questionno:questionNumber,
            data:obj
        });
    if (false === questionNumber) return;
    node.setAttribute('id', 'quiz-question-' + questionNumber);
    for (var i=0,ilen=node.childNodes.length;i<ilen;i+=1) {
        node.removeChild(node.childNodes[0])
    }
    var container = node.parentNode;
    if (moveToBottom) {
        container.removeChild(node);
        container.appendChild(node);
    }
    displayQuestion(obj, questionNumber);
    setButtonState('send-quiz');
}

function displayQuestions (qlst) {
    var questions = document.getElementById('quiz-questions');
    // Purge children
    for (var i=0,ilen=questions.childNodes.length;i<ilen;i+=1) {
        questions.removeChild(questions.childNodes[0]);
    }
    setButtonState('send-quiz',qlst);
    // Display objects in list
    for (var i=0,ilen=qlst.length;i<ilen;i+=1) {
        var question = qlst[i];
        displayQuestion(question,question.questionNumber);
        var node = document.createElement('li');
        node.setAttribute('id', 'quiz-question-' + question.questionNumber);
    }
    return qlst;
}

function displayQuestion (qobj, questionNumber) {

    // XXX Put a listener on the checkbox nodes, so that correct answer
    // XXX can be set and saved without opening and closing the
    // XXX question with the button.

    var questions = document.getElementById('quiz-questions');
    var node = document.getElementById('quiz-question-' + questionNumber);
    if (!node) {
        node = document.createElement('li');
        node.setAttribute('id', 'quiz-question-' + questionNumber);
        questions.appendChild(node);
    }
    var rubric = document.createElement('div');
    rubric.setAttribute('class','rubric-wrapper');
    rubric.innerHTML = '<div class="raw-text-wrapper">'
        + '<div class="raw-text-marker">Source</div>'
        + '<pre class="raw-text">' + qobj.rubric.replace(/<br\/?>/g,'&lt;br/&gt') + '</pre>'
        + '</div>'
        + '<div class="rubric">' + markdown(qobj.rubric) + '</div>'
    node.appendChild(rubric);
    for (var i=0,ilen=qobj.questions.length;i<ilen;i+=1) {
        var choice_wrapper = document.createElement('div');
        choice_wrapper.setAttribute('class', 'choice');
        var checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'radio');
        checkbox.setAttribute('name', 'question-' + questionNumber);
        checkbox.setAttribute('class', 'selection');
        checkbox.setAttribute('onclick', 'writeChoice(' + questionNumber + ', ' + i + ')');
        if (qobj.correct == i) {
            checkbox.checked = true;
        }
        choice_wrapper.appendChild(checkbox)
        var selectionText = document.createElement('div');
        selectionText.setAttribute('class', 'selection-text');
        selectionText.innerHTML = markdown(qobj.questions[i]);
        choice_wrapper.appendChild(selectionText)
        node.appendChild(choice_wrapper)
    }
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', 'Edit Question');
    button.setAttribute('class', 'button editing-button');
    button.setAttribute('onclick', 'openQuestion("' + questionNumber + '")');
    node.appendChild(button);
}

function setDisplayMode (mode) {
    if (mode === 'marking') {
        questionsMode = 'none';
        markingMode = 'block';
    } else {
        questionsMode = 'block';
        markingMode = 'none';
    }
    var questionsDisplayNodes = document.getElementsByClassName('questions-display');
    var markingDisplayNodes = document.getElementsByClassName('marking-display');
    for (var i=0,ilen=questionsDisplayNodes.length;i<ilen;i+=1) {
        questionsDisplayNodes[i].style.display = questionsMode;
    }
    
    for (var i=0,ilen=markingDisplayNodes.length;i<ilen;i+=1) {
        markingDisplayNodes[i].style.display = markingMode;
    }
};

function setButtonState (state,lst) {
    var pending = qzi.pending;
    if ("undefined" === typeof lst) {
        lst = [1];
    }
    var sendQuiz = document.getElementById('send-quiz');
    var quizDone = document.getElementById('quiz-done');
    var downloadExam = document.getElementById('download-exam');
    var markExam = document.getElementById('mark-exam');
    var addQuestion = document.getElementById('add-question-button');
    if (lst.length == 0) {
        sendQuiz.disabled = true;
    } else {
        sendQuiz.disabled = false;
    }
    if ('download-exam' === state) {
        if (pending > 0) {
            state = 'mark-exam';
        } else if (pending === 0) {
            state = 'exam-results';
        }
    }
    switch (state) {
    case 'send-quiz':
        downloadExam.style.display = 'none';
        if (lst.length == 0) {
            sendQuiz.style.display = 'none';
            quizDone.style.display = 'inline';
            quizDone.value = "In Draft";
            enableEditing();
        } else if (pending == -1) {
            sendQuiz.style.display = 'inline';
            sendQuiz.value = 'Send Quiz';
            quizDone.style.display = 'none';
            enableEditing();
        } else if (pending === 0) {
            sendQuiz.style.display = 'none';
            quizDone.style.display = 'inline';
            quizDone.value = "Responses Complete";
            disableEditing();
        } else {
            sendQuiz.style.display = 'inline';
            sendQuiz.value = 'Responses Pending: ' + pending;
            quizDone.style.display = 'none';
            disableEditing();
        }
        break;
    case 'quiz-done':
        sendQuiz.style.display = 'none';
        quizDone.style.display = 'inline';
        quizDone.value = 'Quiz Sent';
        downloadExam.style.display = 'none';
        disableEditing();
        break;
    case 'download-exam':
        sendQuiz.style.display = 'none';
        quizDone.style.display = 'none';
        downloadExam.style.display = 'inline';
        markExam.style.display = 'none';
        break;
    case 'exam-results':
        quizDone.style.display = 'none';
        downloadExam.style.display = 'none';
        markExam.value = 'Display Results';
        markExam.style.display = 'inline';
        sendQuiz.style.display = 'none';
        disableEditing();
        break;
    case 'mark-exam':
        sendQuiz.style.display = 'none';
        quizDone.style.display = 'none';
        downloadExam.style.display = 'inline';
        markExam.style.display = 'inline';
        disableEditing();
        break;
    default:
        sendQuiz.style.display = 'inline';
        quizDone.style.display = 'none';
        downloadExam.style.display = 'none';
        break;
    }
}

