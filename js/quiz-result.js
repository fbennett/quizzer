var classID = getParameterByName('classid');
var studentID = getParameterByName('studentid');
var studentKey = getParameterByName('studentkey');
var quizNumber = getParameterByName('quizno');

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

    console.log(JSON.stringify(quizErrors,null,2));

    var resultList = document.getElementById("result-list");

    resultList.innerHTML = "";

    if (!quizErrors.length) {
        var congratsText = document.createTextNode("Congratulations! You scored 100%");
        var congrats = document.createElement("div");
        congrats.setAttribute('class','congratuations');
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
            resultList.appendChild(answerPair);
            if (quizErrors[i].goodAnswerStudents.length) {
                var lst = quizErrors[i].goodAnswerStudents;
                var studentsPair = document.createElement('div');
                studentsPair.setAttribute("class","students-container");
                var studentsLabel = document.createElement('div');
                studentsLabel.innerHTML = "The following class members got this one right &mdash; ask them to explain why their answer was correct!"
                studentsLabel.setAttribute("class", "correct-students-label");
                studentsPair.appendChild(studentsLabel);
                var studentsList = document.createElement('div');
                studentsList.innerHTML = lst.join(", ");
                studentsList.setAttribute("class", "correct-students-list");
                studentsPair.appendChild(studentsList);
                answerPair.appendChild(studentsPair);
            }
            answerPair.appendChild(wrongAnswer);
            for (var j=0,jlen=quizErrors[i].comments.length;j<jlen;j+=1) {
                var commentObj = quizErrors[i].comments[j];
                var commentDiv = buildComment(commentObj.commenter,commentObj.comment);
                answerPair.appendChild(commentDiv);
            }
        }
    }
}


function buildComment (commenter,comment) {
    var commentContainer = document.createElement('div');
    commentContainer.setAttribute('class', 'comment-container');
    commenterDiv = document.createElement('div');
    commenterDiv.setAttribute('class', 'commenter-name');
    commenterDiv.innerHTML = commenter;
    commentDiv = document.createElement('div');
    commentDiv.innerHTML = markdown(comment);
    commentContainer.appendChild(commenterDiv);
    commentContainer.appendChild(commentDiv);
    return commentContainer;
}
