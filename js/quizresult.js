var classID = getParameterByName('classid');
var studentID = getParameterByName('studentid');
var studentKey = getParameterByName('studentkey');
var quizNumber = getParameterByName('quizno');

function markdown (txt) {
    txt = txt.replace(/\(\(([a-zA-Z1-9])\)\)/g, function (aChar) {
        var c, val, offset;
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

function runResult () {
    var quizErrors = apiRequest(
        '/?cmd=myquizresult&classid=' 
            + classID
            + '&studentid=' 
            + studentID 
            + '&studentkey=' 
            + studentKey 
            + '&quizno=' 
            + quizNumber);
    if (false === quizErrors) return;

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
            rubric.innerHTML = markdown(quizErrors[i].rubric);
            var answerPair =  document.createElement('div');
            answerPair.setAttribute("class", "answer-pair");
            var wrongAnswer = document.createElement('div');
            wrongAnswer.setAttribute("class", "wrong-answer");
            wrongAnswer.innerHTML = markdown(quizErrors[i].wrong);
            var rightAnswer = document.createElement('div');
            rightAnswer.setAttribute("class", "right-answer");
            rightAnswer.innerHTML = markdown(quizErrors[i].right);
            answerPair.appendChild(rubric);
            answerPair.appendChild(rightAnswer);
            answerPair.appendChild(wrongAnswer);
            resultList.appendChild(answerPair);
        }
    }
}
