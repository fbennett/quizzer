var classID = getParameterByName('classid');
var studentID = getParameterByName('studentid');
var studentKey = getParameterByName('studentkey');
var quizNumber = getParameterByName('quizno');
var pageData = {};

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

            for (var j=0,jlen=quizErrors[i].rules.length;j<jlen;j+=1) {
                var rule = quizErrors[i].rules[j];
                var ruleContainer = document.createElement('div');
                ruleContainer.setAttribute('class','rule-container');
                ruleContainer.innerHTML = '<div class="rule-text">' + markdown(rule.ruleText) + '</div>'
                if (rule.ruleGloss) {
                    ruleContainer.innerHTML += '<div class="rule-gloss">' + markdown(rule.ruleGloss) + '</div>'
                }
                answerPair.appendChild(ruleContainer);
            }

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



/* Rules */

function setRuleButtons () {
    var ruleLangButtons = document.getElementsByClassName('rule-lang-buttons');
    // API call
    var commenterKey = getParameterByName('commenter');
    var rows = apiRequest(
        '/?cmd=readrulelangs&classid=' 
            + classID
            + '&studentid=' 
            + studentID 
            + '&studentkey=' 
            + studentKey
    );
    if (false === rows) return;
    var ruleLangButtons = document.getElementById('rule-lang-buttons');
    for (var i=0,ilen=ruleLangButtons.childNodes.length;i<ilen;i+=1) {
        ruleLangButtons.removeChild(ruleLangButtons.childNodes[0]);
    }
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('class', 'button rule-lang-buttons');
        button.setAttribute('onclick', 'setButtonMode("' + row.lang + '","' + row.langName + '")');
        button.value = 'Glosses: ' + row.langName;
        ruleLangButtons.appendChild(button);
    }
}

function setButtonMode (mode,langName) {
    var ruleLangButtons = document.getElementsByClassName('rule-lang-buttons');
    var returnToMainDisplayButton = document.getElementById('return-to-main-display-button');
    var mainDisplay = document.getElementById('main-display');
    var rulesDisplay = document.getElementById('rules-display');
    //var mainDisplayTitle = document.getElementById('main-display-title');
    //var rulesDisplayTitle = document.getElementById('rules-display-title');
    if (mode) {
        pageData.lang = mode;
        pageData.langName = langName;
        buildRulesList(mode,langName);
        for (var i=0,ilen=ruleLangButtons.length;i<ilen;i+=1) {
            ruleLangButtons[i].style.display = 'none';
        }
        returnToMainDisplayButton.style.display = 'inline';
        mainDisplay.style.display = 'none';
        //mainDisplayTitle.style.display = 'none';
        rulesDisplay.style.display = 'table';
        //rulesDisplayTitle.style.display = 'block';
    } else {
        for (var i=0,ilen=ruleLangButtons.length;i<ilen;i+=1) {
            ruleLangButtons[i].style.display = 'inline';
        }
        returnToMainDisplayButton.style.display = 'none';
        mainDisplay.style.display = 'block';
        //mainDisplayTitle.style.display = 'block';
        rulesDisplay.style.display = 'none';
        //rulesDisplayTitle.style.display = 'none';
    }
}

function buildRulesList () {
    var mode = pageData.lang;
    var langName = pageData.langName;
    // zzz
    //var ruleLanguageName = document.getElementById('rule-language');
    //ruleLanguageName.innerHTML = langName;

    // API call for list of rules (admin user + current commenter)
    var classID = getParameterByName('classid');
    var studentID = getParameterByName('studentid');
    var studentKey = getParameterByName('studentkey');
    var rulesForLang = document.getElementById('rules-for-lang');
    var rows = apiRequest(
        '/?cmd=readrules&classid=' 
            + classID
            + '&studentid=' 
            + studentID 
            + '&studentkey=' 
            + studentKey
        , {
            lang:mode
        }
    );
    if (false === rows) return;
    for (var i=0,ilen=rulesForLang.childNodes.length;i<ilen;i+=1) {
        rulesForLang.removeChild(rulesForLang.childNodes[0]);
    }
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var tr = document.createElement('tr');
        tr.setAttribute('id','rule-' + row.ruleID);
        var needsGloss = ' needs-gloss';
        if (row.hasGloss) {
            needsGloss = '';
        }
        tr.innerHTML = '<td class="left' + needsGloss + '" onclick="openRule(this)"><div>' + markdown(row.ruleText) + '</div></td><td class="right"><input type="button" class="button float-right" value="Save" onclick="saveRule(this)" style="display:none;"/><input type="button" class="button float-right" value="Edit" onclick="editRule(this)" style="display:none;"/><input type="button" class="button no-float" value="Del" onclick="confirmDelete(this,\'deleteRule\')" style="display:none;"/></td>';
        rulesForLang.appendChild(tr);
    }
};

function openRule (node) {
    var rownode = node.parentNode;
    var ruleID = rownode.id.split('-').slice(-1)[0];
    var saveButton = rownode.childNodes[1].childNodes[0];
    var deleteButton = rownode.childNodes[1].childNodes[2];
    saveButton.style.display = 'inline';
    // API call
    var commenterKey = getParameterByName('commenter');
    var row = apiRequest(
        '/?cmd=readonerule&classid=' 
            + classID
            + '&studentid=' 
            + studentID 
            + '&studentkey=' 
            + studentKey 
            + '&quizno=' 
            + quizNumber
        ,{
            ruleid:ruleID,
            lang:pageData.lang
        }
    );
    if (false === row) return;
    if (row.ruleSource) {
        var renderedrule = rownode.childNodes[0].childNodes[0];
        var textarea = document.createElement('textarea');
        textarea.innerHTML = row.ruleSource;
        renderedrule.parentNode.replaceChild(textarea,renderedrule);
        deleteButton.style.display = 'inline';
    }
    var tr = document.createElement('tr');
    tr.innerHTML = '<td class="show-box"><div class="show-box-child">' + markdown(row.stringOrig) + '</div></td><td class="edit-box"><textarea>' + row.stringTrans + '</textarea></td>'
    rownode.parentNode.insertBefore(tr,rownode.nextSibling);
    node.setAttribute('onclick','void(0);');
    setChildHeight(tr.childNodes[1].childNodes[0]);
    setChildHeight(tr.childNodes[0].childNodes[0]);
};

function saveRule (node) {
    var rownode = node.parentNode.parentNode;
    var orignode = rownode.nextSibling.childNodes[0];
    var textnode = rownode.nextSibling.childNodes[1].childNodes[0];
    var rulenode = rownode.childNodes[0].childNodes[0];
    ruleText = rulenode.tagName === 'TEXTAREA' ? rulenode.value : null;
    var glossText = textnode.value;
    var ruleID = rownode.id.split('-').slice(-1)[0];
    var saveButton = rownode.childNodes[1].childNodes[0];
    var editButton = rownode.childNodes[1].childNodes[1];
    var deleteButton = rownode.childNodes[1].childNodes[2];
    // API call
    var classID = getParameterByName('classid');
    var studentID = getParameterByName('studentid');
    var studentKey = getParameterByName('studentkey');
    var row = apiRequest(
        '/?cmd=saveonerule&classid=' 
            + classID
            + '&studentid=' 
            + studentID 
            + '&studentkey=' 
            + studentKey 
        ,{
            ruleid:ruleID,
            lang:pageData.lang,
            glosstext:glossText,
            ruletext:ruleText
        }
    );
    if (false === row) return;
    if (ruleText) {
        var ruleTextNode = document.createElement('div');
        ruleTextNode.innerHTML = markdown(row.ruleText);
        rulenode.parentNode.replaceChild(ruleTextNode,rulenode);
        ruleTextNode.parentNode.setAttribute('onclick','closeRule(this);');
    }
    orignode.innerHTML = '<div class="show-box-child">' + markdown(row.stringOrig) + '</div>';
    var renderedNode = document.createElement('div');
    renderedNode.innerHTML = markdown(row.stringTrans);
    textnode.parentNode.replaceChild(renderedNode,textnode);
    saveButton.style.display = 'none';
    editButton.style.display = 'inline';
    deleteButton.style.display = 'none';
    node.parentNode.previousSibling.setAttribute('onclick','closeRule(this);');
};

function editRule (node) {
    var rownode = node.parentNode.parentNode;
    var renderednode = rownode.nextSibling.childNodes[1].childNodes[0];
    var ruleID = rownode.id.split('-').slice(-1)[0];
    var saveButton = rownode.childNodes[1].childNodes[0];
    var editButton = rownode.childNodes[1].childNodes[1];
    var deleteButton = rownode.childNodes[1].childNodes[2];
    // API call
    var commenterKey = getParameterByName('commenter');
    var row = apiRequest(
        '/?cmd=readonerule&classid=' 
            + classID
            + '&studentid=' 
            + studentID 
            + '&studentkey=' 
            + studentKey 
        ,{
            ruleid:ruleID,
            lang:pageData.lang
        }
    );
    if (false === row) return;
    if (row.ruleSource) {
        var renderedrule = rownode.childNodes[0].childNodes[0];
        var textarea = document.createElement('textarea');
        textarea.innerHTML = row.ruleSource;
        renderedrule.parentNode.replaceChild(textarea,renderedrule);
        deleteButton.style.display = 'inline';
    }
    var textnode = document.createElement('textarea');
    textnode.innerHTML = row.stringTrans;
    renderednode.parentNode.replaceChild(textnode,renderednode);
    saveButton.style.display = 'inline';
    editButton.style.display = 'none';
    node.parentNode.previousSibling.setAttribute('onclick','void(0);');
};

function closeRule (node) {
    var rownode = node.parentNode;
    var saveButton = rownode.childNodes[1].childNodes[0];
    var editButton = rownode.childNodes[1].childNodes[1];
    var deleteButton = rownode.childNodes[1].childNodes[2];
    saveButton.style.display = 'none';
    editButton.style.display = 'none';
    deleteButton.style.display = 'none';
    var contentrownode = rownode.nextSibling;
    contentrownode.parentNode.removeChild(contentrownode);
    node.setAttribute('onclick', 'openRule(this);');
    setChildHeight(rownode.nextSibling.childNodes[1].childNodes[0]);
    setChildHeight(rownode.nextSibling.childNodes[0].childNodes[0]);
};

function setChildHeight (textarea) {
    var height = textarea.parentNode.offsetHeight;
    textarea.style.height = height;
};
