function buildQuestionList (quizobj) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');

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
    var questionsLst = displayQuestions(quizobj.questions);
    var button = document.getElementById('add-question-button');
    button.disabled = false;
    var sendQuiz = document.getElementById('send-quiz');
    var quizDone = document.getElementById('quiz-done');
    if (questionsLst.length == 0) {
        sendQuiz.style.display = 'none';
        quizDone.style.display = 'inline';
        quizDone.value = "In Draft";
    } else if (quizobj.pending == -1) {
        sendQuiz.style.display = 'inline';
        sendQuiz.value = 'Send Quiz';
        quizDone.style.display = 'none';
    } else if (quizobj.pending == 0) {
        sendQuiz.style.display = 'none';
        quizDone.style.display = 'inline';
        quizDone.value = "Responses Complete";
        disableEditing();
    } else {
        sendQuiz.style.display = 'inline';
        sendQuiz.value = 'Responses Pending: ' + quizobj.pending;
        quizDone.style.display = 'none';
        disableEditing();
    }
}

function disableEditing () {
    var buttons = document.getElementsByClassName('editing-button');
    for (var i=0,ilen=buttons.length;i<ilen;i+=1) {
        buttons[i].style.display = 'none';
    }
    var radios = document.getElementsByClassName('selection');
    for (var i=0,ilen=radios.length;i<ilen;i+=1) {
        var radio = radios[i];
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
    var sendQuizButton = document.getElementById('send-quiz');
    var quizDoneButton = document.getElementById('quiz-done');
    sendQuizButton.style.display = 'none';
    quizDoneButton.style.display = 'inline';
    quizDoneButton.value = 'Quiz Sent';
    disableEditing();
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
    questions.appendChild(openQuestion());
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
    var rubricBox = document.createElement('textarea');
    rubricBox.setAttribute('style', 'vertical-align: top;');
    rubricBox.setAttribute('placeholder', 'Enter rubric here');
    rubricBox.value = qobj.rubric;
    rubricBox.setAttribute('cols', '70');
    rubricBox.setAttribute('rows', '3');
    rubric.appendChild(rubricBox);
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', 'Standard');
    button.setAttribute('onclick', 'standardRubric(' + questionNumber + ')')
    button.setAttribute('class', 'button');
    rubric.appendChild(button);
    node.appendChild(rubric);

    for (var i=0,ilen=qobj.questions.length;i<ilen;i+=1) {
        var choice_wrapper = document.createElement('div');
        choice_wrapper.setAttribute('class', 'choice');
        var checkbox = document.createElement('input');
        if (qobj.correct === i) {
            checkbox.setAttribute('checked', true);
        }
        checkbox.setAttribute('name', 'question-' + questionNumber);
        checkbox.setAttribute('type', 'radio');
        checkbox.setAttribute('class', 'selection');
        choice_wrapper.appendChild(checkbox)
        var selectionText = document.createElement('textarea');
        selectionText.setAttribute('cols', '60');
        selectionText.setAttribute('rows', '3');
        selectionText.setAttribute('class', 'selection-text');
        selectionText.setAttribute('placeholder', 'Enter choice here');
        selectionText.value = qobj.questions[i];
        choice_wrapper.appendChild(selectionText)
        var cloneButton = document.createElement('input');
        cloneButton.setAttribute('type', 'button');
        if (i === 0) {
            cloneButton.setAttribute('value', 'Copy to all');
            cloneButton.setAttribute('onclick', 'copyToAll(' + questionNumber + ');');
            cloneButton.setAttribute('class', 'button');
        } else {
            cloneButton.setAttribute('value', 'Ditto');
            cloneButton.setAttribute('onclick', 'dittoPrevious(' + questionNumber + ',' + i + ');');
            cloneButton.setAttribute('class', 'button');
        }
        choice_wrapper.appendChild(cloneButton);
        node.appendChild(choice_wrapper);
    }
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', 'Save Question');
    button.setAttribute('onclick', 'closeQuestion("' + questionNumber + '")');
    button.setAttribute('class', 'button');
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

function closeQuestion (questionNumber) {

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
    displayQuestion(obj, questionNumber);
    setSendButton([1]);
    // Add some magic to change the button back to "Add Question"
    var button = document.getElementById('add-question-button');
    button.disabled = false;
}

function setSendButton (lst) {
    var sendQuiz = document.getElementById("send-quiz");
    if (!lst.length) {
        sendQuiz.disabled = true;
    } else {
        sendQuiz.disabled = false;
    }
}

function displayQuestions (quizobj) {
    var questions = document.getElementById('quiz-questions');
    // Purge children
    for (var i=0,ilen=questions.childNodes.length;i<ilen;i+=1) {
        questions.removeChild(questions.childNodes[0]);
    }
    // Sort return
    var lst = [];
    for (var key in quizobj) {
        lst.push(key);
    }
    lst.sort(function(a,b){
        var a = parseInt(a, 10);
        var b = parseInt(b, 10);
        if (a>b) {
            return 1;
        } else if (a<b) {
            return -1;
        } else {
            return 0;
        }
    });
    setSendButton(lst);
    // Display objects in lst
    for (var i=0,ilen=lst.length;i<ilen;i+=1) {
        displayQuestion(quizobj[lst[i]], lst[i]);
        var node = document.createElement('li');
        node.setAttribute('id', 'quiz-question-' + lst[i]);
    }
    return lst;
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
    rubric.setAttribute("class", "rubric");
    rubric.innerHTML = markdown(qobj.rubric);
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
