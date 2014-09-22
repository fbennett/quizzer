function allowDrop(ev) {
    ev.preventDefault();
    if (!ev.dataTransfer || ev.dataTransfer.getData("ruleID").slice(0,7) !== 'demote:') {
        return;
    }
    return true;
};
function dragLang(ev) {
    dump("MLZ: dragLang()"+ev.target.id+"\n");
    ev.dataTransfer.setData('Text',ev.target.id);
};
function dropLang(ev) {
    ev.preventDefault();
    if (ev.target.tagName === 'TD') {
        var data=ev.dataTransfer.getData("Text");
        var adminID = getParameterByName('admin');
        ev.target.setAttribute('style','border:none;');
        var languageBubble = document.createElement('span');
        languageBubble.setAttribute('onclick','confirmDelete(this,\'removeLanguage\')');
        languageBubble.setAttribute('value',data);
        languageBubble.innerHTML = data.toUpperCase();
        var space = document.createTextNode(' ');
        ev.target.insertBefore(languageBubble,ev.target.childNodes[0]);
        ev.target.insertBefore(space,ev.target.childNodes[0]);
        var commenterKey = ev.target.previousSibling.previousSibling.previousSibling.textContent;
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=commenters'
                + '&cmd=setcommenterlanguage'
            ,{
                lang:data,
                commenterkey:commenterKey
            }
        );
        if (false === rows) return;
    }
}
function removeLanguage(node) {
    var commenterKey = node.parentNode.previousSibling.previousSibling.previousSibling.textContent;
    var adminID = getParameterByName('admin');
    var lang = node.getAttribute('value');
    node.parentNode.removeChild(node);
    var rows = apiRequest(
        '/?admin='
            + adminID
            + '&page=commenters'
            + '&cmd=removecommenterlanguage'
        ,{
            lang:lang,
            commenterkey:commenterKey
        }
    );
    if (false === rows) return;
};
function dragenterLang(ev) {
    ev.preventDefault();
    if (ev.target.tagName === 'TD') {
        ev.target.setAttribute('style','border:1px dashed black;');
    }
};
function dragleaveLang(ev) {
    ev.preventDefault();
    if (ev.target.tagName === 'TD') {
        ev.target.setAttribute('style','border:none;');
    }
};

function buildCommenterList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var adminID = getParameterByName('admin');
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=commenters'
                + '&cmd=readcommenters'
        );
        if (false === rows) return;
    }
    // Delete children from container
    var container = document.getElementById('commenter-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var commenterTR = document.createElement('tr');
        if (row.complete == 0) {
            commenterTR.setAttribute('class','inactive');
        }
        commenterTR.innerHTML = '<td><input class="button-small i18n" name="value-edit" type="button" value="Edit" onclick="addCommenter(this)"/></td>'
            + '<td><a href="' + fixPath("/?commenter=" + row.adminKey) + '">' + row.name + '</a></td>'
            + '<td>' + getMailDaySelect(row.adminKey,row.interval) + '</td>'
            + '<td class="email">' + getEmail(row.email)  + '</td>'
            + '<td style="display:none;">' + row.adminKey + '</td>'
            + '<td><input class="mail-tick" type="checkbox" value="' + row.adminKey + '"/></td>'
            + '<td>' + row.numberOfComments + '</td>'
            + '<td class="language-bubbles" ondragover="allowDrop(event)" ondrop="dropLang(event)" ondragenter="dragenterLang(event)" ondragleave="dragleaveLang(event)">' + getSerializedLanguageNodes(row.languages) + '<div></div></td>';
        container.appendChild(commenterTR);
    }
    i18n();
}

function getSerializedLanguageNodes(langstr) {
    var langs = [];
    if (langstr) {
        langs = langstr.split(',');
    }
    var ret = '';
    for (var i=0,ilen=langs.length;i<ilen;i+=1) {
        var lang = langs[i];
        ret += '<span onclick="confirmDelete(this,\'removeLanguage\')" value="' + lang + '">' + lang.toUpperCase() + '</span>';
    }
    return ret;
}

function getEmail (email) {
    if (!email) {
        email = '';
    }
    return email;
}

function getMailDaySelect(commenterID,dow,disabled) {
    var days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    var select = '<select onchange="setCommenterMailDay(this,\'' + commenterID + '\')"/>'
        + '<option class="i18n" name="content-none" value="none">none</option>'
    for (var i=0,ilen=7;i<ilen;i+=1) {
        if (i === dow) {
            select += '<option class="i18n" name="content-' + days[i] + '" value="' + i + '" selected="true">' + days[i] + '</option>';
        } else {
            select += '<option class="i18n" name="content-' + days[i] + '" value="' + i + '">' + days[i] + '</option>';
        }
    }
    select += '</select>'
    return select;
}

function setCommenterMailDay (node,commenterKey) {
    var adminID = getParameterByName('admin');
    var dow = node.value;
    if (dow === 'none') {
        dow = null;
    }
    var rows = apiRequest(
        '/?admin='
            + adminID
            + '&page=commenters'
            + '&cmd=setcommentermailday'
        ,{
            commenterkey:commenterKey,
            dow:dow
        }
    );
    if (false === rows) return;
    buildCommenterList();
}

function addCommenter(node) {
    // Does double duty as the edit function
    var addButton = document.getElementById('add-commenter-button');
    var saveButton = document.getElementById('save-commenter-button');
    var commenterBoxes = document.getElementById('commenter-boxes');
    var commenterName = document.getElementById('commenter-name');
    var commenterMailDay = document.getElementById('commenter-dow');
    var commenterEmail = document.getElementById('commenter-email');
    var commenterKey = document.getElementById('commenter-key');
    if (node) {
        var container = node.parentNode.parentNode;
        var name = container.childNodes[1].textContent;
        var dow = container.childNodes[2].childNodes[0].value;
        var email = container.childNodes[3].textContent;
        var key = container.childNodes[4].textContent;
        // Set on edit nodes
        commenterName.value = name;
        commenterMailDay.value = dow;
        commenterEmail.value = email;
        commenterKey.value = key;
    }
    addButton.style.display = 'none';
    saveButton.style.display = 'inline';
    commenterBoxes.style.display = 'inline';
}

function saveCommenter() {
    // Need to add class ID, for edits
    var addButton = document.getElementById('add-commenter-button');
    var saveButton = document.getElementById('save-commenter-button');
    var commenterBoxes = document.getElementById('commenter-boxes');

    var commenterName = document.getElementById('commenter-name');
    var commenterMailDay = document.getElementById('commenter-dow');
    var commenterEmail = document.getElementById('commenter-email');
    var commenterKey = document.getElementById('commenter-key');

    // Values
    var name = commenterName.value;
    var dow = commenterMailDay.value;
    if ('none' === dow) {
        dow = null;
    } else {
        dow = parseInt(dow,10);
    }
    var email = commenterEmail.value;
    var key = commenterKey.value;
    if (!name && key) {
        alert("A name is required");
        // Restore from server
        var adminID = getParameterByName('admin');
        var obj = apiRequest(
            '/?admin='
                + adminID
                + '&page=commenters'
                + '&cmd=readonecommenter'
            , {
                commenterkey:key
            });
        if (false === obj) return;
        commenterName.value = obj.name;
    } else if (name) {
        // Save
        var adminID = getParameterByName('admin');
        var apires = apiRequest(
            '/?admin='
                + adminID 
                + '&page=commenters'
                + '&cmd=addcommenter'
            , {
                name:name,
                commenterkey:key,
                email:email,
                dow:dow
            });
        if (false === apires) return;
        buildCommenterList();
    }
    if (name || (!name && !email && !key)) {
        // Clear
        commenterName.value = null;
        commenterMailDay.value = 'none';
        commenterEmail.value = null;
        commenterKey.value = null;
        // Redecorate
        addButton.style.display = 'inline';
        saveButton.style.display = 'none';
        commenterBoxes.style.display = 'none';
    }
};

function sendCommenterMail (ev) {
    var keys = [];
    var msgNode = document.getElementById('mail-message');
    var msg = msgNode.value;
    var subjNode = document.getElementById('mail-subject');
    var subj = subjNode.value;
    var keyNodes = document.getElementsByClassName('mail-tick');
    for (var i=0,ilen=keyNodes.length;i<ilen;i+=1) {
        if (keyNodes[i].checked) {
            keys.push(keyNodes[i].value);
        }
    }
    if (!msg || !subj || !keys.length) {
        return;
    }
    var adminID = getParameterByName('admin');
    var apires = apiRequest(
        '/?admin='
            + adminID 
            + '&page=commenters'
            + '&cmd=sendcommentermail'
        , {
            msg:msg,
            keys:keys,
            subj:subj
        });
    if (false === apires) return;
    // clear content if successful
    msgNode.value = '';
    subjNode.value = '';
    for (var i=0,ilen=keyNodes.length;i<ilen;i+=1) {
        keyNodes[i].checked = false;
    }
};
