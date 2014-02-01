var pageData = {};

function editRules() {
    setButtonMode(true);

    // API call
    var adminID = getParameterByName('admin');
    var rows = apiRequest(
        '/?admin='
            + adminID
            + '&page=rules'
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
    //setCommentersBlockPosition();
};

function buildRulesLists() {
    // API call
    var adminID = getParameterByName('admin');
    var ruleGroupID = getParameterByName('groupid');
    var rows = apiRequest(
        '/?admin='
            + adminID
            + '&page=rules'
            + '&cmd=getrules'
        , {
            groupid:ruleGroupID
        }
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
                + '&page=rules'
                + '&cmd=promoteonerule'
            ,{
                ruleid:ruleID
            }
        );
        if (false === rows) return;
        buildRulesLists();
    }
};

function allowDemoteDrop(ev) {
    ev.preventDefault();
    if (!ev.dataTransfer || ev.dataTransfer.getData("ruleID").slice(0,7) !== 'demote:') {
        return;
    }
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
                + '&page=rules'
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
    ev.preventDefault();
    if (!ev.dataTransfer 
        || ev.dataTransfer.getData("ruleID").slice(0,7) !== 'mergex:') {
        return;
    }
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
    ev.dataTransfer.setData('ruleID','mergex:'+ev.target.id);
};

function dropMergeRule(ev) {
    ev.preventDefault();
    var targ = getParent(ev.target,'td');
    var senpaiRuleID = targ.id;
    if (targ.id === ev.dataTransfer.getData("ruleID").slice(7)) {
        return;
    }
    var okToDemote = confirm("Merge this rule with target?");
    if (okToDemote) {
        // API call
        var kohaiRuleID = ev.dataTransfer.getData("ruleID").slice(7);
        var adminID = getParameterByName('admin');
        var result = apiRequest(
            '/?admin='
                + adminID
                + '&page=rules'
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
    var curleft = 0;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
            curleft += obj.offsetLeft;
        } while (obj = obj.offsetParent);
        return [curleft,curtop];
    }
}
    
function getParent (node,tagname) {
    var targ = node;
    while (targ.tagName !== tagname.toUpperCase()) {
        targ = targ.parentNode;
    }
    return targ;
}

//window.addEventListener('resize', setCommentersBlockPosition);

function setCommentersBlockPosition (event){
    var phantom = document.getElementById('commenters-list-phantom');
    var width = phantom.offsetWidth;
    var xy = findPos(phantom);
    var top = xy[1];
    var left = xy[0];
    var commenters = document.getElementById('commenters-list');
    commenters.setAttribute('style','position:fixed;top:' + 0 + 'px;left:' + left + 'px;width:' + width + 'px');
};

/* StackOverflow to the rescue http://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html */

function f_filterResults(n_win, n_docel, n_body) {
	var n_result = n_win ? n_win : 0;
	if (n_docel && (!n_result || (n_result > n_docel)))
		n_result = n_docel;
	return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
}

function f_scrollTop() {
	return f_filterResults (
		window.pageYOffset ? window.pageYOffset : 0,
		document.documentElement ? document.documentElement.scrollTop : 0,
		document.body ? document.body.scrollTop : 0
	);
}

function trackScroll (ev) {
    var phantom = document.getElementById('commenters-list-phantom');
    var commenters = document.getElementById('commenters-list');
    var xy = findPos(phantom);
    var top = xy[1];
    var vOffset = f_scrollTop();
    console.log("vOffset="+vOffset+", top="+top);
    if (vOffset < top) {
        if (commenters.hasAttribute('style')) {
            commenters.removeAttribute('style');
        }
    } else {
        if (!commenters.hasAttribute('style')) {
            setCommentersBlockPosition();
        }
    }
}

function setButtonMode(rulesMode) {
    return;
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

