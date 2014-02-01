var pageData = {};

function buildQuizList (rows) {
    var commenterID = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    if (!rows) {
        // if rows is nil, call the server.
        var rows = apiRequest(
            '/?commenter='
                + commenterID
                + '&page=class'
                + '&cmd=readquizzes'
            , {
                classid:classID
            }
        );
        if (false === rows) return;
    }
    rows.sort(function (a,b) {
        a = parseInt(a.number,10);
        b = parseInt(b.number,10);
        if (a>b) {
            return 1;
        } else if (a<b) {
            return -1;
        } else {
            return 0;
        }
    });
    // Delete children from container
    var container = document.getElementById('quiz-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var nameText = document.createTextNode("Quiz "+rows[i].number);
        var idText = document.createTextNode(rows[i].number);
        var tr = document.createElement('tr');
        var nameAnchor = document.createElement('a');
        var nameTD = document.createElement('td');
        var idTD = document.createElement('td');
        nameAnchor.appendChild(nameText);

        nameAnchor.setAttribute('href', fixPath('/?commenter=' + commenterID + '&page=quiz&classid=' + classID + '&quizno=' + rows[i].number));

        nameTD.appendChild(nameAnchor);
        tr.appendChild(nameTD);
        idTD.appendChild(idText);
        idTD.style.display = 'none';
        tr.appendChild(idTD)
        if (rows[i].numberOfCommentsNeeded) {
            var markerText = document.createTextNode('(' + rows[i].numberOfCommentsNeeded + ')');
            var markerTD = document.createElement('td');
            markerTD.appendChild(markerText);
            tr.appendChild(markerTD);
        }
        container.appendChild(tr);
    }
}

function setRuleButtons () {
    var ruleLangButtons = document.getElementsByClassName('rule-lang-buttons');
    // API call
    var commenterKey = getParameterByName('commenter');
    var rows = apiRequest(
        '/?commenter='
            + commenterKey
            + '&page=class'
            + '&cmd=readrulelangs'
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
    var mainDisplayTitle = document.getElementById('main-display-title');
    var rulesDisplayTitle = document.getElementById('rules-display-title');
    if (mode) {
        pageData.lang = mode;
        pageData.langName = langName;
        buildRulesList(mode,langName);
        for (var i=0,ilen=ruleLangButtons.length;i<ilen;i+=1) {
            ruleLangButtons[i].style.display = 'none';
        }
        returnToMainDisplayButton.style.display = 'inline';
        mainDisplay.style.display = 'none';
        mainDisplayTitle.style.display = 'none';
        rulesDisplay.style.display = 'table';
        rulesDisplayTitle.style.display = 'block';
    } else {
        for (var i=0,ilen=ruleLangButtons.length;i<ilen;i+=1) {
            ruleLangButtons[i].style.display = 'inline';
        }
        returnToMainDisplayButton.style.display = 'none';
        mainDisplay.style.display = 'table';
        mainDisplayTitle.style.display = 'block';
        rulesDisplay.style.display = 'none';
        rulesDisplayTitle.style.display = 'none';
    }
}

function buildRulesList () {
    var mode = pageData.lang;
    var langName = pageData.langName;
    var ruleLanguageName = document.getElementById('rule-language');
    ruleLanguageName.innerHTML = langName;
    // API call for list of rules (admin user + current commenter)
    var commenterKey = getParameterByName('commenter');
    var classID = getParameterByName('classid');
    var rulesForLang = document.getElementById('rules-for-lang');
    var rows = apiRequest(
        '/?commenter='
            + commenterKey
            + '&page=class'
            + '&cmd=readrules'
        , {
            lang:mode,
            classid:classID
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

function deleteRule (node) {
    // API call
    var rownode = node.parentNode.parentNode;
    var ruleID = rownode.id.split('-').slice(-1)[0];
    var commenterKey = getParameterByName('commenter');
    var row = apiRequest(
        '/?commenter='
            + commenterKey
            + '&page=class'
            + '&cmd=deleteonerule'
        ,{
            ruleid:ruleID,
            lang:pageData.lang
        }
    );
    if (false === row) return;
    var nextnode = rownode.nextSibling;
    nextnode.parentNode.removeChild(nextnode);
    rownode.parentNode.removeChild(rownode);
};


function setTexareaHeight (textarea) {
    var height = textarea.parentNode.offsetHeight;
    textarea.style.height = height;
}


function openRule (node) {
    var rownode = node.parentNode;
    var ruleID = rownode.id.split('-').slice(-1)[0];
    var saveButton = rownode.childNodes[1].childNodes[0];
    var deleteButton = rownode.childNodes[1].childNodes[2];
    saveButton.style.display = 'inline';
    // API call
    var commenterKey = getParameterByName('commenter');
    var row = apiRequest(
        '/?commenter='
            + commenterKey
            + '&page=class'
            + '&cmd=readonerule'
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
    setTextareaHeight(tr.childNodes[1].childNodes[0]);
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
    var commenterKey = getParameterByName('commenter');
    var row = apiRequest(
        '/?commenter='
            + commenterKey
            + '&page=class'
            + '&cmd=saveonerule'
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
    orignode.innerHTML = markdown(row.stringOrig);
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
        '/?commenter='
            + commenterKey
            + '&page=class'
            + '&cmd=readonerule'
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
};
