function clearContainer (container) {
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
}

function showMistakes () {
    var commenterID = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var quizMistakes = apiRequest(
        '/?commenter='
            + commenterID
            +'&page=quiz&cmd=quizmistakes'
            + '&classid=' 
            + classID
            + '&quizno=' 
            + quizNumber);
    if (false === quizMistakes) return;
    // Empty the container
    var container = document.getElementById('quiz-mistakes');
    clearContainer(container);
    // Get name of commenter from return
    var commenter = quizMistakes.commenter;
    // For each mistake ...
    for (var i=0,ilen=quizMistakes.mistakes.length;i<ilen;i+=1) {
        var mistake = quizMistakes.mistakes[i];
        var mistakeDiv = document.createElement('div');
        mistakeDiv.setAttribute('id', 'mistake-' + mistake.questionNumber + '-' + mistake.wrongChoice);
        var rubricText = markdown(mistake.rubric);
        var correctText = markdown(mistake.correct);
        var wrongText = markdown(mistake.wrong);
        var buttonMode = {edit:'none',comment:'inline',save:'none'};
        if (mistake.hasCommenterComment) {
            buttonMode = {edit:'inline',comment:'none',save:'none'};
        }
        mistakeDiv.innerHTML = '<div class="answer-pair"><div class="rubric">' + rubricText + '</div>'
            + '<div class="right-answer">' + correctText + '</div>'
            + '<div class="wrong-answer">' + wrongText + '</div></div>'
            + '<div class="button-bold">'
            + '<input type="button" class="button" '
            + 'id="comment-button-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" '
            + 'style="display:'
            + buttonMode.comment
            + '" value="Comment" '
            + 'onclick="newComment(this,\'comment-' + commenter + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '<input type="button" class="button" '
            + 'id="edit-button-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" '
            + 'style="display:'
            + buttonMode.edit
            + '" value="Edit" '
            + 'onclick="openComment(\'comment-' + commenter + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '<input type="button" class="button" '
            + 'id="save-button-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" '
            + 'style="display:'
            + buttonMode.save
            + '" value="Save" '
            + 'onclick="saveComment(\'comment-' + commenter + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '</div>';
        var questionNumber = mistake.questionNumber;
        var wrongChoice = mistake.wrongChoice;
        for (var j=0,jlen=mistake.comments.length;j<jlen;j+=1) {
            var commenter = mistake.comments[j].commenter;
            var comment = mistake.comments[j].comment;
            var commentContainer = buildComment(questionNumber,wrongChoice,commenter,comment);
            mistakeDiv.appendChild(commentContainer);
        }
        container.appendChild(mistakeDiv);
        
    }
}

function buildComment (questionNumber,wrongChoice,commenter,comment) {
    var commentContainer = document.createElement('div');
    commentContainer.setAttribute('class', 'comment-container');
    commentContainer.setAttribute('id','comment-' + commenter + '-' + questionNumber + '-' + wrongChoice);
    commenterDiv = document.createElement('div');
    commenterDiv.setAttribute('class', 'commenter-name');
    commenterDiv.innerHTML = commenter;
    commentDiv = document.createElement('div');
    commentDiv.innerHTML = markdown(comment);
    commentContainer.appendChild(commenterDiv);
    commentContainer.appendChild(commentDiv);
    return commentContainer;
}

function openComment (id) {
    var commenterID = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var m = id.split('-');
    var questionNumber = m[2];
    var wrongChoice = m[3];
    var commentText = apiRequest(
        '/?commenter='
            + commenterID
            +'&page=quiz&cmd=getonecomment'
            + '&classid=' 
            + classID
            + '&quizno=' 
            + quizNumber
        , {
            questionno:questionNumber,
            wrongchoice: wrongChoice
        }
    );
    if (false === commentText) return;
    
    var node = document.getElementById(id);
    buildOpenComment(node,questionNumber,wrongChoice,commentText);
}

function buildOpenComment(node,questionNumber,wrongChoice,commentText) {
    node.innerHTML = '<textarea style="width:100%" cols="60" rows="3" class="selection-text" placeholder="Saving a comment without content will remove it">'
        + commentText
        + '</textarea>'
    setButtonMode('save',questionNumber,wrongChoice);
}

function saveComment (id) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var commenter = getParameterByName('commenter');
    var m = id.split('-');
    var questionNumber = m[2];
    var wrongChoice = m[3];
    var commenter = m[1];
    var node = document.getElementById(id);
    var comment = node.firstChild.value;
    if (comment) {
        var commentBlock = buildComment(questionNumber,wrongChoice,commenter,comment);
        node.parentNode.insertBefore(commentBlock,node);
        node.parentNode.removeChild(node);
        setButtonMode('edit',questionNumber,wrongChoice);
    } else {
        // Delete from server, remove the node, restore to comment mode
        node.parentNode.removeChild(node);
        setButtonMode('comment',questionNumber,wrongChoice)
    }
    writeComment(questionNumber,wrongChoice,comment);
}

function newComment(button,id) {
    var parent = button.parentNode;
    var uncle = parent.nextSibling;
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var commenter = getParameterByName('commenter');
    var m = id.split('-');
    var questionNumber = m[2];
    var wrongChoice = m[3];
    var commenter = m[1];
    var commentContainer = document.createElement('div');
    commentContainer.setAttribute('id',id);
    commentContainer.setAttribute('class','comment-container');
    parent.parentNode.insertBefore(commentContainer,uncle);
    buildOpenComment(commentContainer,questionNumber,wrongChoice,'');
}

function setButtonMode (mode,questionNumber,wrongChoice) {
    var commentButton = document.getElementById('comment-button-' + questionNumber + '-' + wrongChoice);
    var editButton = document.getElementById('edit-button-' + questionNumber + '-' + wrongChoice);
    var saveButton = document.getElementById('save-button-' + questionNumber + '-' + wrongChoice);
    if (mode === 'edit') {
        commentButton.setAttribute('style', 'display:none');
        editButton.setAttribute('style', 'display:inline');
        saveButton.setAttribute('style', 'display:none');
    } else if (mode === 'save') {
        commentButton.setAttribute('style', 'display:none');
        editButton.setAttribute('style', 'display:none');
        saveButton.setAttribute('style', 'display:inline');
    } else {
        commentButton.setAttribute('style', 'display:inline');
        editButton.setAttribute('style', 'display:none');
        saveButton.setAttribute('style', 'display:none');
    }
};

function writeComment (questionNumber,wrongChoice,comment) {
    var commenterID = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    if (comment) {
        comment = comment.replace(/^\s+/,'').replace(/\s+$/,'');
    }
    var ignoreStr = apiRequest(
        '/?commenter='
            + commenterID
            +'&page=quiz&cmd=writeonecomment'
            + '&classid=' 
            + classID
            + '&quizno=' 
            + quizNumber
        , {
            questionno:questionNumber,
            wrongchoice: wrongChoice,
            comment: comment
        }
    );
}
