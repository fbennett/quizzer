function clearContainer (container) {
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
}

var commenterInfo = {};
var quizMistakes;

function showMistakes () {
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    quizMistakes = apiRequest(
        '/?commenter='
            + commenterKey
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
    commenterInfo.commenter = quizMistakes.commenter;
    commenterInfo.commenterID = quizMistakes.commenterID;
    // For each mistake ...
    for (var i=0,ilen=quizMistakes.mistakes.length;i<ilen;i+=1) {
        var mistake = quizMistakes.mistakes[i];
        var mistakeDiv = document.createElement('div');
        mistakeDiv.setAttribute('id', 'mistake-' + mistake.questionNumber + '-' + mistake.wrongChoice);
        var rubricText = markdown(mistake.rubric);
        var correctText = markdown(mistake.correct);
        var langBubbles = '';
        if (mistake.langs) {
            var langs = mistake.langs.split(',');
            langBubbles = ' <div class="language-bubble">' + langs.join('</div> <div class="language-bubble">') + '</div>';
        }
        var wrongText = markdown(langBubbles + mistake.wrong);
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
            + 'onclick="newComment(this,\'comment-' + commenterInfo.commenterID + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '<input type="button" class="button" '
            + 'id="edit-button-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" '
            + 'style="display:'
            + buttonMode.edit
            + '" value="Edit" '
            + 'onclick="openComment(\'comment-' + commenterInfo.commenterID + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '<input type="button" class="button" '
            + 'id="save-button-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" '
            + 'style="display:'
            + buttonMode.save
            + '" value="Save" '
            + 'onclick="saveComment(\'comment-' + commenterInfo.commenterID + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '<input type="button" class="button" '
            + 'id="eg-button-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" '
            + 'style="display:'
            + buttonMode.save
            + '" value="e.g." '
            + 'onclick="copyDown(this,\'comment-' + commenterInfo.commenterID + '-' + mistake.questionNumber + '-' + mistake.wrongChoice + '\')"'
            +'/>'
            + '<select class="rule-dropdown" onclick="" id="rule-' + mistake.questionNumber + '-' + mistake.wrongChoice + '" onfocus="buildRuleSelect(this);" onchange="addRuleToMistake(this)"><option value="none">Tag with a rule</option></select>'
            + '<div style="display:none;">' + mistake.wrong + '</div>'
            + '</div>';
        var questionNumber = mistake.questionNumber;
        var wrongChoice = mistake.wrongChoice;
        for (var j=0,jlen=mistake.comments.length;j<jlen;j+=1) {
            var commenter = mistake.comments[j].commenter;
            var commenterID = mistake.comments[j].commenterID;
            var comment = mistake.comments[j].comment;
            var commentContainer = buildComment(questionNumber,wrongChoice,commenter,commenterID,comment);
            mistakeDiv.appendChild(commentContainer);
        }
        for (var j=0,jlen=mistake.rules.length;j<jlen;j+=1) {
            var rule = mistake.rules[j];
            var ruleNode = buildRule(questionNumber,wrongChoice,rule.ruleid,rule.ruletext);
            mistakeDiv.childNodes[0].appendChild(ruleNode);
        }
        container.appendChild(mistakeDiv);
    }
}

function addRuleToMistake (node) {
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    // Figure out which choice we're looking at
    var m = node.id.split('-');
    var questionNumber = m[1];
    var wrongChoice = m[2];
    var ruleid = node.value;

    // Call the server to attach the rule if necessary,
    // and to find out whether it needs to be added
    // in the UI.
    var ruleData = apiRequest(
        '/?commenter='
            + commenterKey
            +'&page=quiz&cmd=attachrule'
            + '&classid=' 
            + classID
            + '&quizno=' 
            + quizNumber
        , {
            questionno:questionNumber,
            wrongchoice: wrongChoice,
            ruleid:ruleid
        }
    );
    if (false === ruleData) return;
    
    // If it needs to be added, add it.
    if (ruleData.ruleID) {
        var pairNode = node.parentNode.previousSibling;
        var ruleNode = buildRule(questionNumber,wrongChoice,ruleData.ruleID,ruleData.ruleText);
        pairNode.appendChild(ruleNode);
    }
    // Then reset the value on the select
};

function buildRuleSelect (node) {
    for (var i=1,ilen=node.childNodes.length;i<ilen;i+=1) {
        node.removeChild(node.childNodes[1]);
    }
    var selections = [];
    for (var i=0,ilen=quizMistakes.selections.length;i<ilen;i+=1) {
        var rule = quizMistakes.selections[i];
        var option = document.createElement('option');
        option.setAttribute('value',rule.ruleid);
        option.innerHTML = markdown(rule.ruletext);
        option.innerHTML = option.textContent;
        selections.push({node:option,str:option.textContent});
    }
    selections.sort(function(a,b){if(a.str>b.str){return 1}else if(a.str>b.str){return -1}else{return 0}});
    for (var i=0,ilen=selections.length;i<ilen;i+=1) {
        node.appendChild(option);
    }
};

function copyDown(node,id) {
    var targetNode = document.getElementById(id);
    if (targetNode.childNodes[0].textContent) {
        return;
    }
    var wrongText = node.nextSibling.textContent;
    targetNode.childNodes[0].innerHTML = '> ' + wrongText;
}

function buildComment (questionNumber,wrongChoice,commenter,commenterID,comment) {
    var commentContainer = document.createElement('div');
    commentContainer.setAttribute('class', 'comment-container');
    commentContainer.setAttribute('id','comment-' + commenterID + '-' + questionNumber + '-' + wrongChoice);
    commentContainer.innerHTML = '<div class="commenter-name">' + commenter + '</div>'
        + '<div>' + markdown(comment) + '</div>';
    return commentContainer;
}

function openComment (id) {
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    var m = id.split('-');
    var questionNumber = m[2];
    var wrongChoice = m[3];
    var commentText = apiRequest(
        '/?commenter='
            + commenterKey
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
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    //var commenterID = getParameterByName('commenter');
    var m = id.split('-');
    var questionNumber = m[2];
    var wrongChoice = m[3];
    var commenterID = m[1];
    var node = document.getElementById(id);
    var comment = node.firstChild.value;

    // Check whether the comment text contains one or more rules
    var lst = comment.split('\n\n');
    var rules = {top:null,other:[]};
    for (var i=lst.length-1;i>-1;i+=-1) {
        var m = lst[i].match(/^>>>(.*)/);
        if (m) {
            var rule = m[1].replace(/^\s+/,'').replace(/\s+$/,'');
            if (i === 0) {
                rules.top = rule;
                lst = lst.slice(1);
            } else {
                rules.other.push(rule);
            }
        }
    }
    //console.log("XX "+JSON.stringify(rules));
    // Reconstruct comment
    comment = lst.join('\n\n').replace(/^\s+/,'');
    // Rules
    if (rules.top || rules.other.length) {
        // Send rules to server for saving
        var ruleData = apiRequest(
            '/?commenter='
                + commenterKey
                +'&page=quiz&cmd=getrule'
                + '&classid=' 
                + classID
                + '&quizno=' 
                + quizNumber
            , {
                questionno:questionNumber,
                wrongchoice: wrongChoice,
                rules:rules
            }
        );
        if (false === ruleData) return;
        // Refresh dropdown list
        quizMistakes.selections = ruleData.selections;

        // Add top rule to UI
        if (ruleData.ruleID && rules.top) {
            var editButton = document.getElementById('edit-button-' + questionNumber + '-' +wrongChoice);
            var ruleBlock = buildRule(questionNumber,wrongChoice,ruleData.ruleID,rules.top);
            var answerPairNode = editButton.parentNode.previousSibling;
            answerPairNode.appendChild(ruleBlock);
        }
    }
    // Handle comment
    if (comment) {
        var commentBlock = buildComment(questionNumber,wrongChoice,commenterInfo.commenter,commenterInfo.commenterID,comment);
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


function removeRule (node) {
    // XXX
    // Simple API call
    var m = node.id.split('-');
    var questionNumber = m[1];
    var wrongChoice = m[2];
    var ruleID = m[3];
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    apiRequest(
        '/?commenter='
            + commenterKey
            +'&page=quiz&cmd=removerule'
            + '&classid=' 
            + classID
            + '&quizno=' 
            + quizNumber
        , {
            questionno:questionNumber,
            wrongchoice: wrongChoice,
            ruleid:ruleID
        }
    );
    node.parentNode.parentNode.parentNode.removeChild(node.parentNode.parentNode);
};

function buildRule (questionNumber,wrongChoice,ruleID,ruleText) {
    // Build the object
    var ruleContainer = document.createElement('div');
    ruleContainer.setAttribute('class', 'rule-container');
    ruleContainer.setAttribute('id', 'rule-' + ruleID + '-' + questionNumber + '-' +wrongChoice);
    // XXXX
    ruleContainer.innerHTML = '<div class="rule-button"><input type="button" id="removerule-' + questionNumber + '-' + wrongChoice + '-' + ruleID + '" class="button-small" onclick="confirmDelete(this,\'removeRule\')" value="Del"/></div><div>' + markdown(ruleText) + '</div>';
    // Return
    return ruleContainer;
};

function refreshDropdownList (ruleData,questionNumber,wrongChoice) {
    var dropdownList = document.getElementById('rule-' + questionNumber + '-' + wrongChoice);
    for (var i=1,ilen=dropdownList.childNodes.length;i<ilen;i+=1) {
        dropdownList.removeChild(dropdownList.childNodes[1]);
    }
    for (var i=0,ilen=ruleData.selections.length;i<ilen;i+=1) {
        var selection = ruleData.selections[i];
        var option = document.createElement('option');
        option.setAttribute('value',selection.ruleID);
        option.innerHTML = markdown(selection.ruleText);
        option.innerHTML = option.textContent;
        dropdownList.appendChild(option);
    }
    
}

function newComment(button,id) {
    var parent = button.parentNode;
    var uncle = parent.nextSibling;
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    //var commenterID = getParameterByName('commenter');
    var m = id.split('-');
    var questionNumber = m[2];
    var wrongChoice = m[3];
    //var commenterID = m[1];
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
    var egButton = document.getElementById('eg-button-' + questionNumber + '-' + wrongChoice);
    if (mode === 'edit') {
        commentButton.setAttribute('style', 'display:none');
        editButton.setAttribute('style', 'display:inline');
        saveButton.setAttribute('style', 'display:none');
        egButton.setAttribute('style', 'display:none');
    } else if (mode === 'save') {
        commentButton.setAttribute('style', 'display:none');
        editButton.setAttribute('style', 'display:none');
        saveButton.setAttribute('style', 'display:inline');
        egButton.setAttribute('style', 'display:inline');
    } else {
        commentButton.setAttribute('style', 'display:inline');
        editButton.setAttribute('style', 'display:none');
        saveButton.setAttribute('style', 'display:none');
        egButton.setAttribute('style', 'display:none');
    }
};

function writeComment (questionNumber,wrongChoice,comment) {
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var quizNumber = getParameterByName('quizno');
    if (comment) {
        comment = comment.replace(/^\s+/,'').replace(/\s+$/,'');
    }
    var ignoreStr = apiRequest(
        '/?commenter='
            + commenterKey
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
