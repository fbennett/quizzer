var pageData = {};

function buildClassList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var commenterID = getParameterByName('commenter');
        var rows = apiRequest(
            '/?commenter='
                + commenterID
                + '&page=top'
                + '&cmd=readclasses'
        );
        if (false === rows) return;
    }
    // Delete children from container
    var container = document.getElementById('class-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var numberOfCommentsNeeded = '';
        if (row.numberOfCommentsNeeded > 0) {
            numberOfCommentsNeeded = '(' + row.numberOfCommentsNeeded + ')'
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'
            + '<a href="' 
            + fixPath('/?commenter=' + commenterID + '&page=class&classid=' + rows[i].classID) + '">'
            + row.name 
            + '</a>'
            + '</td>'
            + '<td>' + numberOfCommentsNeeded + '</td>'
            + '<td style="display:none;">' + row.classID + '</td>'
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
            + '&page=top'
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
    var rulesForLang = document.getElementById('rules-for-lang');
    var rulesDisplay = document.getElementById('rules-display');
    var mainDisplayTitle = document.getElementById('main-display-title');
    var rulesDisplayTitle = document.getElementById('rules-display-title');
    var ruleLanguageName = document.getElementById('rule-language');
    if (mode) {
        // API call for list of rules (admin user + current commenter)
        var commenterKey = getParameterByName('commenter');
        var rows = apiRequest(
            '/?commenter='
                + commenterKey
                + '&page=top'
                + '&cmd=readrules'
        );
        if (false === rows) return;
        for (var i=0,ilen=rulesForLang.childNodes.length;i<ilen;i+=1) {
            rulesForLang.removeChild(rulesForLang.childNodes[0]);
        }
        for (var i=0,ilen=rows.length;i<ilen;i+=1) {
            var row = rows[i];
            var tr = document.createElement('tr');
            tr.innerHTML = '<td class="left"><div id="rule-' + row.ruleID + '" onclick="openRule(this)">' + row.ruleText + '</div></td><td></td>';
            rulesForLang.appendChild(tr);
        }
        
        ruleLanguageName.innerHTML = langName;
        pageData.lang = row.langName;
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

function openRule (node) {
    var rownode = node.parentNode.parentNode;
    var ruleID = node.id.split('-').slice(-1)[0];
    // API call
    var commenterKey = getParameterByName('commenter');
    var row = apiRequest(
        '/?commenter='
            + commenterKey
            + '&page=top'
            + '&cmd=readonerule'
        ,{
            ruleid:ruleID,
            lang:pageData.lang
        }
    );
    if (false === row) return;
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><div class="show-box">' + row.stringOrig + '</div></td><td><textarea class="edit-box">' + row.stringTrans + '</textarea></td>'
    rownode.parentNode.insertBefore(tr,rownode.followingSibling);
};
