var pageData = {};

function addClass(node) {
    // Does double duty as the edit function
    var addButton = document.getElementById('add-class-button');
    var saveButton = document.getElementById('save-class-button');
    var classBoxes = document.getElementById('class-boxes');
    var className = document.getElementById('class-name');
    var classID = document.getElementById('class-id');
    if (node) {
        var name = node.childNodes[0].textContent;
        var id = node.childNodes[1].textContent;
        className.value = name;
        classID.value = id;
    }
    if (classID.value) {
        classID.disabled = true;
    } else {
        classID.disabled = false;
    }
    addButton.style.display = 'none';
    saveButton.style.display = 'inline';
    classBoxes.style.display = 'inline';
}

function saveClass() {
    // Need to add class ID, for edits
    var addButton = document.getElementById('add-class-button');
    var saveButton = document.getElementById('save-class-button');
    var classBoxes = document.getElementById('class-boxes');
    var className = document.getElementById('class-name');
    var classID = document.getElementById('class-id');
    // Values
    var name = className.value;
    var id = classID.value;
    if (name) {
        // Save
        var adminID = getParameterByName('admin');
        var apires = apiRequest(
            '/?admin='
                + adminID 
                + '&page=classes'
                + '&cmd=addclass'
            , {
                name:name,
                classid:id
            });
        if (false === apires) return;
        buildClassList();
    }
    if (name || (!name && !id)) {
        // Clear
        className.value = null;
        classID.value = null;
        // Redecorate
        addButton.style.display = 'inline';
        saveButton.style.display = 'none';
        classBoxes.style.display = 'none';
    } else {
        alert("A name is required");
        // Restore from server
        var adminID = getParameterByName('admin');
        var obj = apiRequest(
            '/?admin='
                + adminID
                + '&page=classes'
                + '&cmd=readoneclass'
            , {
                classid:id
            });
        if (false === obj) return;
        className.value = obj.name;
    }
}

function buildClassList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var adminID = getParameterByName('admin');
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=classes'
                + '&cmd=readclasses'
        );
        if (false === rows) return;
    }
    rows.sort(function (a,b) {
        // Sort by ???
        return a[0].localeCompare(b[0]);
    });
    // Delete children from container
    var container = document.getElementById('class-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var nameText = document.createTextNode(rows[i][0]);
        var idText = document.createTextNode(rows[i][1]);
        var tr = document.createElement('tr');
        var nameAnchor = document.createElement('a');
        var nameTD = document.createElement('td');
        var idTD = document.createElement('td');
        nameAnchor.appendChild(nameText);
        nameAnchor.setAttribute('href', fixPath('/?admin=' + adminID + '&page=class&classid=' + rows[i][1]));
        nameTD.appendChild(nameAnchor);
        tr.appendChild(nameTD);
        idTD.appendChild(idText);
        idTD.style.display = 'none';
        tr.appendChild(idTD)
        // Edit button
        var buttonTD = document.createElement('td');
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'Edit');
        button.setAttribute('onclick', 'addClass(this.parentNode.parentNode)');
        button.setAttribute('class', 'button-small');
        buttonTD.appendChild(button);
        tr.appendChild(buttonTD);
        container.appendChild(tr);
    }
}

function editRules() {
    setButtonMode(true);

    // API call
    var adminID = getParameterByName('admin');
    var rows = apiRequest(
        '/?admin='
            + adminID
            + '&page=classes'
            + '&cmd=getcommenters'
    );
    if (false === rows) return;
    var commentersList = document.getElementById('commenters-list');
    var commentersListPhantom = document.getElementById('commenters-list-phantom');
    var commenters = [];
    var commenters_phantom = [];
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        commenters.push('<span class="commenter" id="commenter-' + row.adminID + '" ondragover="allowDemoteDrop(event)" ondrop="dropDemoteRule(event)" ondragleave="dragleaveDemoteRule(event)">' + row.name + '</span>');
        commenters_phantom.push('<span>' + row.name + '</span>');
    }
    commentersList.innerHTML = commenters.join(' ');
    commentersListPhantom.innerHTML = commenters_phantom.join(' ');
    pageData.commenters = document.getElementsByClassName('commenter');;
    buildRulesLists();
    var width = commentersList.offsetWidth;
    commentersList.setAttribute('style','position:fixed;top:' + commentersList.offsetTop + 'px;left:' + commentersList.offsetLeft + 'px;width:' + width + 'px');
};

function buildRulesLists() {
    // API call
    var adminID = getParameterByName('admin');
    var rows = apiRequest(
        '/?admin='
            + adminID
            + '&page=classes'
            + '&cmd=getrules'
    );
    if (false === rows) return;
    var rulesListAdmin = document.getElementById('rules-list-admin');
    var rulesListCommenters = document.getElementById('rules-list-commenters');
    for (var i=0,ilen=rulesListAdmin.childNodes.length;i<ilen;i+=1) {
        rulesListAdmin.removeChild(rulesListAdmin.childNodes[0]);
    }
    for (var i=0,ilen=rulesListCommenters.childNodes.length;i<ilen;i+=1) {
        rulesListCommenters.removeChild(rulesListCommenters.childNodes[0]);
    }
    pageData.adminrules = [];
    for (var i=0,ilen=rows.admin.length;i<ilen;i+=1) {
        var row = rows.admin[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td draggable="true" ondragstart="dragDemoteRule(event);" ondragend="dragendDemoteRule(event);" ondragover="allowMergeDrop(event);" ondrop="dropMergeRule(event);" ondragleave="dragleaveMergeRule(event);" id="' + row.ruleID + '">' + markdown(row.string) + '</td>';
        rulesListAdmin.appendChild(tr);
        pageData.adminrules.push(tr.childNodes[0]);
    }
    for (var i=0,ilen=rows.commenters.length;i<ilen;i+=1) {
        var row = rows.commenters[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td draggable="true" ondragstart="dragMergeRule(event)" ondragend="dragendMergeRule(event);" id="' + row.ruleID + '" title="' + row.name + '" onclick="promoteRule(this)">' + markdown(row.string) + '</td>';
        rulesListCommenters.appendChild(tr);
    }
    
};

function promoteRule(node) {
    var okToPromote = confirm("Promote this rule for general use?");
    if (okToPromote) {
        var adminID = getParameterByName('admin');
        var ruleID = node.id;
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=classes'
                + '&cmd=promoteonerule'
            ,{
                ruleid:ruleID
            }
        );
        if (false === rows) return;
        buildRulesLists();
    }
};

function setButtonMode(rulesMode) {
    var returnToMainButton = document.getElementById('return-to-main-display-button');
    var editRulesButton = document.getElementById('edit-rules-button');
    var addClassButton = document.getElementById('add-class-button');
    var saveClassButton = document.getElementById('save-class-button');
    var classBoxes = document.getElementById('class-boxes');

    var mainDisplay = document.getElementById('main-display');
    var rulesDisplay = document.getElementById('rules-display');

    var mainDisplayTitle = document.getElementById('main-display-title');
    var rulesDisplayTitle = document.getElementById('rules-display-title');

    if (rulesMode) {
        returnToMainButton.style.display = 'inline';
        editRulesButton.style.display = 'none';
        addClassButton.style.display = 'none';
        saveClassButton.style.display = 'none';
        classBoxes.style.display = 'none';
        mainDisplay.style.display = 'none';
        rulesDisplay.style.display = 'block';
        mainDisplayTitle.style.display = 'none';
        rulesDisplayTitle.style.display = 'block';
    } else {
        returnToMainButton.style.display = 'none';
        editRulesButton.style.display = 'inline';
        addClassButton.style.display = 'inline';
        saveClassButton.style.display = 'none';
        classBoxes.style.display = 'none';
        mainDisplay.style.display = 'block';
        rulesDisplay.style.display = 'none';
        mainDisplayTitle.style.display = 'block';
        rulesDisplayTitle.style.display = 'none';
    }
};

function allowDemoteDrop(ev) {
    if (ev.dataTransfer.getData("ruleID").slice(0,7) !== 'demote:') {
        return;
    }
    ev.preventDefault();
    for (var i=0,ilen=pageData.commenters.length;i<ilen;i+=1) {
        if (pageData.commenters[i].hasAttribute('style')) {
            pageData.commenters[i].removeAttribute('style');
        }
    }
    ev.target.setAttribute('style','border:1px dashed black;border-radius:0;background:#00ff00;');
};

function dragDemoteRule(ev) {
    ev.dataTransfer.setData('ruleID','demote:'+ev.target.id);
};

function dragendDemoteRule(ev) {
    for (var i=0,ilen=pageData.commenters.length;i<ilen;i+=1) {
        if (pageData.commenters[i].hasAttribute('style')) {
            pageData.commenters[i].removeAttribute('style');
        }
    }
};

function dropDemoteRule(ev) {
    ev.preventDefault();
    var commenterID = ev.target.id.split('-').slice(-1)[0];
    var commenterName = ev.target.textContent;
    var okToDemote = confirm("Demote this rule for use only by " + commenterName + "?");
    if (okToDemote) {
        // API call
        var ruleID = ev.dataTransfer.getData("ruleID").slice(7);
        var adminID = getParameterByName('admin');
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=classes'
                + '&cmd=demoteonerule'
            ,{
                ruleid:ruleID,
                commenterid:commenterID
            }
        );
        if (false === rows) return;
        buildRulesLists();
    }
    ev.target.removeAttribute('style');
};

function dragleaveDemoteRule(ev) {
    ev.preventDefault();
    if ("function" === typeof ev.target.removeAttribute) {
        ev.target.removeAttribute('style');
    }
};



function allowMergeDrop(ev) {
    if (ev.dataTransfer.getData("ruleID").slice(0,6) !== 'merge:') {
        return;
    }
    ev.preventDefault();
    dragendMergeRule();
    var targ = getParent(ev.target,'td');
    targ.setAttribute('style','border:1px dashed black;border-radius:0;background:#00ff00;');
};

function dragendMergeRule(ev) {
    for (var i=0,ilen=pageData.adminrules.length;i<ilen;i+=1) {
        if (pageData.adminrules[i].hasAttribute('style')) {
            pageData.adminrules[i].removeAttribute('style');
        }
    }
};


function dragMergeRule(ev) {
    window.scroll(0,findPos(document.getElementById("commenters-list")));
    ev.dataTransfer.setData('ruleID','merge:'+ev.target.id);
};

function dropMergeRule(ev) {
    ev.preventDefault();
    var targ = getParent(ev.target,'td');
    var senpaiRuleID = targ.id;
    var okToDemote = confirm("Merge this rule with target?");
    if (okToDemote) {
        // API call
        var kohaiRuleID = ev.dataTransfer.getData("ruleID").slice(6);
        var adminID = getParameterByName('admin');
        var result = apiRequest(
            '/?admin='
                + adminID
                + '&page=classes'
                + '&cmd=mergetworules'
            ,{
                kohairuleid:kohaiRuleID,
                senpairuleid:senpaiRuleID
            }
        );
        if (false === result) return;
        buildRulesLists();
    }
    targ.removeAttribute('style');
};

function dragleaveMergeRule(ev) {
    ev.preventDefault();
    if (ev.target.tagName === 'TD') {
        ev.target.removeAttribute('style');
    }
};

/* for scrolling
 * Ahnsirk Dasarp
 * http://stackoverflow.com/questions/5007530/how-do-i-scroll-to-an-element-using-javascript
 */

//Finds y value of given object
function findPos(obj) {
    var curtop = 0;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    return [curtop];
    }
}
    
function getParent (node,tagname) {
    var targ = node;
    while (targ.tagName !== tagname.toUpperCase()) {
        targ = targ.parentNode;
    }
    return targ;
}