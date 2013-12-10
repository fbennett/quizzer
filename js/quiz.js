function buildQuestionList () {
    // Call for quiz questions
    // NO! Only in test itself. Randomize responses and affix response map to object
    // NO! Only in test itself. Randomize questions and set question map
    // Build HTML for each question, rendering text with markdown
    //   var txt = marked.parse("This is a *cat*, it is.");
    var questions = document.getElementById('quiz-questions');
    // Delete children
    // Write children by looping over server data with the following structure:
    //questions.appendChild(displayQuestion(qobj));
}

function addQuestion () {
    // Add a question node and populate using openQuestion()
    var questions = document.getElementById('quiz-questions');
    questions.appendChild(openQuestion());
    // Add some magic to change the button to "Save question"
}

function openQuestion (questionNumber) {
    if (!questionNumber) {
        questionNumber = 0;
    }
    var qobj = {};
    if (questionNumber) {
        // If questionNumber present, call for JSON of question from server
    } else {
        // Otherwise, create empty object
        qobj = {
            rubric: "",
            questions: ["", "", "", ""],
            correct: 3
        }
    }
    var node = document.createElement('li');
    var rubric = document.createElement('textarea');
    rubric.setAttribute('style', 'vertical-align: top;');
    rubric.setAttribute('placeholder', 'Enter rubric here');
    rubric.value = qobj.rubric;
    rubric.setAttribute('cols', '70');
    rubric.setAttribute('rows', '3');
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
        selectionText.setAttribute('style', 'vertical-align: top;');
        selectionText.setAttribute('cols', '60');
        selectionText.setAttribute('rows', '3');
        selectionText.setAttribute('class', 'selection-text');
        selectionText.setAttribute('placeholder', 'Enter choice here');
        selectionText.value = qobj.questions[i];
        choice_wrapper.appendChild(selectionText)
        node.appendChild(choice_wrapper)
    }
    return node;
}

function closeQuestion (questionNumber) {
    // Saves text-box content to object
    // Rewrites current text-box node content as text nodes
    displayQuestion(qobj);
    // Sends object to server for saving
}

function displayQuestion (qobj) {
    var node = document.createElement('li');
    var rubric = document.createElement('div');
    rubric.innerHTML = marked.parse(qobj.rubric);
    node.appendChild(rubric);
    for (var i=0,ilen=qobj.questions.length;i<ilen;i+=1) {
        var choice_wrapper = document.createElement('div');
        choice_wrapper.setAttribute('class', 'choice');
        var checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'radio');
        checkbox.setAttribute('class', 'selection');
        choice_wrapper.appendChild(checkbox)
        var selectionText = document.createElement('div');
        selectionText.setAttribute('class', 'selection-text');
        selectionText.innerHTML = marked.parse(qobj.questions[i]);
        choice_wrapper.appendChild(selectionText)
        node.appendChild(choice_wrapper)
    }
    return node;

}