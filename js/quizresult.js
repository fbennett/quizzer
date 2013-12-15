var classID = getParameterByName('classid');
var studentID = getParameterByName('id');
var studentKey = getParameterByName('key');
var quizNumber = getParameterByName('quizno');
var hostname = getParameterByName('hostname');
if (!hostname) {
    hostname = 'our.law.nagoya-u.ac.jp';
}

function runResult () {
    var postpath = 'http://' + hostname + ':3498/?cmd=myquizresult&classid=' + classID+ '&id=' + studentID + '&key=' + studentKey + '&quizno=' + quizNumber;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', postpath, false);
    xhr.setRequestHeader("Content-type","text/plain");
    xhr.send(null);
    var quizErrors = JSON.parse(xhr.responseText);
    
    var resultList = document.getElementById("result-list");

    resultList.innerHTML = "";

    if (!quizErrors.length) {
        var congratsText = document.createTextNode("Congratulations! You scored 100%");
        var congrats = document.createElement("div");
        congrats.appendChild(congratsText);
        resultList.appendChild(congrats);
    } else {
        var explain = document.createElement("div");
        explain.innerHTML = "(Correct answers are double-boxed)";
        for (var i=0,ilen=quizErrors.length;i<ilen;i+=1) {
            var rubric = document.createElement("div");
            rubric.setAttribute("class", "rubric");
            rubric.innerHTML = marked.parse(quizErrors[i].rubric);
            var answerPair =  document.createElement('div');
            answerPair.setAttribute("class", "answer-pair");
            var wrongAnswer = document.createElement('div');
            wrongAnswer.setAttribute("class", "wrong-answer");
            wrongAnswer.innerHTML = marked.parse(quizErrors[i].wrong);
            var rightAnswer = document.createElement('div');
            rightAnswer.setAttribute("class", "right-answer");
            rightAnswer.innerHTML = marked.parse(quizErrors[i].right);
            answerPair.appendChild(rubric);
            answerPair.appendChild(rightAnswer);
            answerPair.appendChild(wrongAnswer);
            resultList.appendChild(answerPair);
        }
    }
}
