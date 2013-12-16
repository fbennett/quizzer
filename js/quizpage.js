var nextnodecounter = 0;
var setvalue; 
var getvalue;  
var ansarry = new Array();
var i;

var classID = getParameterByName('classid');
var studentID = getParameterByName('id');
var studentKey = getParameterByName('key');
var quizNumber = getParameterByName('quizno');
var hostname = getParameterByName('hostname');
if (!hostname) {
    hostname = 'our.law.nagoya-u.ac.jp';
}

var quizResult = {};

function markdown (txt) {
    txt = txt.replace(/\(\(([a-zA-Z1-9])\)\)/g, function (aChar) {
        var val, offset;
        if (aChar[2].match(/[a-z]/)) {
            val = (aChar.charCodeAt(2) - 97)
            offset = 9424;
        } else if (aChar[2].match(/[A-Z]/)) {
            val = (aChar.charCodeAt(2) - 65)
            offset = 9398;
        } else {
            val = (aChar.charCodeAt(2) - 49)
            offset = 9312;
        }
        return String.fromCharCode(val + offset);
    });
    return marked.parse(txt);
}

var quizData;
function runQuiz() {

    // Get quiz data
    quizData = apiRequest(
        'http://' 
            + hostname 
            + ':3498/?cmd=quizdata&classid=' 
            + classID
            + '&id=' 
            + studentID 
            + '&key=' 
            + studentKey 
            + '&quizno=' 
            + quizNumber);

    for (var i=0,ilen=quizData.questions.length;i<ilen;i+=1) {
        remap = randomize(quizData.questions[i].questions);
        quizData.questions[i].remap = remap;
    }
    var remap = randomize(quizData.questions);
    quizData.remap = remap;
    displaychild(quizData);
}

function displaychild(quizData) {  
    document.getElementById("nextButton").disabled = true;  
	if (document.getElementById("nextButton").innerHTML == "Show&nbsp;Result") {  
        document.getElementById("nextButton").onclick = ShowResult;
        document.getElementById("nextButton").disabled = false;
    }
    if (quizData.questions.length == nextnodecounter) {
        return;
    }
    var question = quizData.questions[nextnodecounter];
    document.getElementById("question").innerHTML = markdown(question.rubric);
    
    // display question text  
	var options = document.getElementById("options")
    options.innerHTML = "";
    for (var i=0,ilen=question.questions.length;i<ilen;i+=1) {

        var radioBtn = document.createElement('li');
        var choiceDiv = document.createElement('div');
        choiceDiv.setAttribute('class', 'choice');
        var input = document.createElement('input');
        input.setAttribute('name', 'r1');
        input.setAttribute('type', 'radio');
        input.setAttribute('value', i);
        input.setAttribute('onclick', 'enablebtn(' + i + ')');
        input.setAttribute('id', ('rbtnCount' + i));
        var label = document.createElement('div');
        label.setAttribute('class', 'label');
        label.innerHTML = markdown(question.questions[i]);
        choiceDiv.appendChild(input);
        choiceDiv.appendChild(label);
        radioBtn.appendChild(choiceDiv);
        options.appendChild(radioBtn);
        checkradiobtn();
    }
}  

function FunNextNode() {
	var questions = quizData.questions;
    var realqno = questions[nextnodecounter].number;
    quizResult[realqno] = questions[nextnodecounter].remap[getvalue];
	nextnodecounter = nextnodecounter + 1;
    if (questions.length == (nextnodecounter)) {
        document.getElementById("nextButton").innerHTML = "Show&nbsp;Result";
    }
    displaychild(quizData);  
}  

function checkradiobtn () {  
	var radios =
        document.getElementsByTagName('input');  
    var value;
    for (var i = 0; i < radios.length; i++) {
	    if (radios[i].type == 'radio' && radios[i].checked) {
		    document.getElementById("nextButton").disabled = true;  
        }
    }
}

function enablebtn(setvalue) {  
	document.getElementById("nextButton").disabled = false;  
    getvalue = setvalue;  
}  

function ShowResult() {
    var resultPageUrl = apiRequest(
        'http://' 
            + hostname 
            + ':3498/?cmd=writequizresult&classid=' 
            + classID 
            + '&id=' 
            + studentID 
            + '&key=' 
            + studentKey 
            + '&quizno=' 
            + quizNumber
        , {
            quizres:quizResult
        }
        , true);
    window.location.href = resultPageUrl;
}

function randomize(array) {
    var new_order = [];
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;
    var temporaryPos;

    for (var i=0,ilen=array.length;i<ilen;i+=1) {
        new_order.push(i);
    }

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // Swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
        // Same treatment for the sequence map
        temporaryPos = new_order[currentIndex];
        new_order[currentIndex] = new_order[randomIndex];
        new_order[randomIndex] = temporaryPos;
    }
    var remap = {};
    for (var i=0,ilen=array.length;i<ilen;i+=1) {
        remap[i] = new_order[i];
    }
    return remap;
}
