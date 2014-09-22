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

            for (var j=0,jlen=quizErrors[i].comments.length;j<jlen;j+=1) {
                var commentObj = quizErrors[i].comments[j];
                var commentDiv = buildComment(commentObj.commenter,commentObj.comment);
                answerPair.appendChild(commentDiv);
            }

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
        }
    }
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    if (zzz) {
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

    // Only show buttons if the student has open rules.

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
    var mainDisplay = document.getElementsByClassName('main-display');
    var rulesDisplay = document.getElementsByClassName('rules-display');
    var studentLanguage = document.getElementsByClassName('student-language');
    //var mainDisplayTitle = document.getElementById('main-display-title');
    //var rulesDisplayTitle = document.getElementById('rules-display-title');
    if (mode) {
        pageData.lang = mode;
        pageData.langName = langName;
        buildRulesList(mode,langName);

        setNodesDisplay(ruleLangButtons,false);
        setNodesDisplay(mainDisplay,false);
        setNodesDisplay(rulesDisplay,true);
        setNodesInnerHtml(studentLanguage,langName);
        returnToMainDisplayButton.style.display = 'inline';
    } else {
        setNodesDisplay(ruleLangButtons,true);
        setNodesDisplay(mainDisplay,true);
        setNodesDisplay(rulesDisplay,false);
        returnToMainDisplayButton.style.display = 'none';
    }
}

function setNodesDisplay (nodes,displayMode) {
    for (var i=0,ilen=nodes.length;i<ilen;i+=1) {
        var node = nodes[i];
        if (!displayMode) {
            node.style.display = 'none';
        } else if (node.tagName === 'TABLE') {
            node.style.display = 'table';
        } else if (node.tagName === 'DIV') {
            node.style.display = 'block';
        } else {
            node.style.display = 'inline';
        }
    }
};

function setNodesInnerHtml (nodes,innerHTML) {
    for (var i=0,ilen=nodes.length;i<ilen;i+=1) {
        nodes[i].innerHTML = innerHTML;
    }
};

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
        var questionIDs = row.questionIDs.split(',');
        var tr = document.createElement('tr');
        tr.setAttribute('id','rule-' + row.ruleID);
        var onClick;
        var rowStyle;
        if (questionIDs.length > 1) {
            if (row.count) {
                // Study candidate, display rendered, offer to send questions
                onClick = ' onclick="showRule(this,true)"';
                // Yellow border
                rowStyle = " study-needed-rule";
            } else {
                // Cleared, display source, offer to edit
                onClick = ' onclick="openRule(this)"';
                // Green border
                rowStyle = " cleared-rule";
            }
        } else {
            // Read-only rule, display rendered
            onClick = ' onclick="showRule(this)"';
            // Grey border
            rowStyle = "";
        }
        tr.innerHTML = '<td class="left' + rowStyle + '"' + onClick + '><div>' + markdown(row.ruleText) + '</div></td><td class="right"><input type="button" class="button float-right" value="Save" onclick="saveRule(this)" style="display:none;"/><input type="button" class="button float-right" value="Edit" onclick="editRule(this)" style="display:none;"/><input type="button" class="button no-float" value="Del" onclick="confirmDelete(this,\'deleteRule\')" style="display:none;"/><input type="button" class="button float-right" value="Test Yourself!" onclick="window.location.href = \'' + composeRetryURL(row.questionIDs) + '\'" style="display:none;"></td>';

        rulesForLang.appendChild(tr);
    }
};

function composeRetryURL(ids) {

    // So what the hell does this do?
    // It will need access to the questionIDs reported from the call, so that string should
    // be set on a hidden node or an attribute. If we have that, we can generate the mail ...
    // and then it's up to other architecture in the system.
    var questionIDs = ids.split(',');

    // This can either send a mail out with a link, or it can immediately
    // open a browser tab that contains the targeted quizzlet. Immediate
    // opening probably makes more sense -- unless that won't play well
    // on cellphones, which some students will be using.

    // Probably the smoothest thing would be to not open a new anything.
    // Click the button, and the mini-quiz loads in the current
    // window and tab. Finish the quiz, get your feedback, then click 
    // continue (somewhere), and the rules-list is called again, with 
    // updated decorations.

    // So you'll need all of the parameters necessary to regenerate the
    // rules list in the reTest server call.
    
    // Need gloss language, so we can come back here.

    return fixPath('/?studentid=' 
                   + studentID 
                   + '&studentkey=' 
                   + studentKey 
                   + '&classid=' 
                   + classID
                   + '&quizno='
                   + quizNumber
                   + '&questionids=' 
                   + questionIDs
                   + '&glosslang=' 
                   + pageData.lang);
}

function showRule (node,offerRetest) {
    var rownode = node.parentNode;
    var testButton = rownode.childNodes[1].childNodes[3];
    var ruleID = rownode.id.split('-').slice(-1)[0];
    // API call
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

    var tr = document.createElement('tr');
    setDisplaySourceView(tr,row);
    if (offerRetest) {
        testButton.style.display = 'inline';
        node.setAttribute('onclick','closeRule(this,true);');
    } else {
        node.setAttribute('onclick','closeRule(this);');
    }
    rownode.parentNode.insertBefore(tr,rownode.nextSibling);
    setChildHeight(rownode.nextSibling.childNodes[1].childNodes[0]);
    setChildHeight(rownode.nextSibling.childNodes[0].childNodes[0]);
}

function openRule (node) {
    var rownode = node.parentNode;
    var ruleID = rownode.id.split('-').slice(-1)[0];
    // API call
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

    var saveButton = rownode.childNodes[1].childNodes[0];
    saveButton.style.display = 'inline';

    var tr = document.createElement('tr');
    setEditableSourceView(tr,row);
    rownode.parentNode.insertBefore(tr,rownode.nextSibling);
    node.setAttribute('onclick','void(0);');
    //node.setAttribute('onclick','closeRule(this);');
    setChildHeight(rownode.nextSibling.childNodes[1].childNodes[0]);
    setChildHeight(rownode.nextSibling.childNodes[0].childNodes[0]);
};

function setEditableSourceView(tr,row) {
    tr.innerHTML = '<td class="show-box"><pre class="show-box-child">' + row.stringOrig + '</pre></td><td class="edit-box"><textarea>' + row.stringTrans + '</textarea></td>'
};

function setDisplaySourceView(tr,row) {
    tr.innerHTML = '<td class="show-box"><div class="show-box-child">' + markdown(row.stringOrig) + '</div></td><td class="show-box"><div class="show-box-child">' + markdown(row.stringTrans) + '</div></td>'
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
    setEditableSourceView(rownode.nextSibling,row)
    saveButton.style.display = 'inline';
    editButton.style.display = 'none';
    node.parentNode.previousSibling.setAttribute('onclick','void(0);');
    setChildHeight(rownode.nextSibling.childNodes[1].childNodes[0]);
    setChildHeight(rownode.nextSibling.childNodes[0].childNodes[0]);
};

function closeRule (node,showRule) {
    var rownode = node.parentNode;
    var saveButton = rownode.childNodes[1].childNodes[0];
    var editButton = rownode.childNodes[1].childNodes[1];
    var deleteButton = rownode.childNodes[1].childNodes[2];
    var testButton = rownode.childNodes[1].childNodes[3];
    saveButton.style.display = 'none';
    editButton.style.display = 'none';
    deleteButton.style.display = 'none';
    var contentrownode = rownode.nextSibling;
    contentrownode.parentNode.removeChild(contentrownode);
    if (showRule) {
        node.setAttribute('onclick', 'showRule(this,true);');
        testButton.style.display = 'none';
    } else {
        node.setAttribute('onclick', 'openRule(this);');
    }
};

function setChildHeight (textarea) {
    var height = textarea.parentNode.offsetHeight;
    textarea.style.height = height + 'px';
};
