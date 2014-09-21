var i18nStrings = {};
function i18n () {
    var data = {
        value:[],
        content:[]
    };
    var nodes = document.getElementsByClassName('i18n');
    for (var i=0,ilen=nodes.length;i<ilen;i++) {
        var node = nodes[i];
        var nodeName = node.getAttribute('name');
        if (nodeName) {
            var m = nodeName.match(/^(value|content)-(.*)$/);
            if (m) {
                data[m[1]].push({
                    node:node,
                    string:m[2]
                })
                i18nStrings[m[2]] = "undefined";
            }
        }
    }
    // Send strings to server in a batch
    var adminID = getParameterByName('admin');
    var roleName = 'admin';
    if (!adminID) {
        adminID = getParameterByName('commenter');
        roleName = 'commenter'
    }
    var roleAndID;
    if (adminID) {
        roleAndID = roleName + '=' + adminID + '&';
    } else {
        roleAndID = '';
    }
    i18nStrings = apiRequest(
        '/?' + roleAndID 
            + 'page=i18n'
        , {
            strings:i18nStrings
        }
    );
    if (false === i18nStrings) return;
    // Perform substitutions
    for (var i=0,ilen=data.value.length;i<ilen;i++) {
        data.value[i].node.setAttribute('value',i18nStrings[data.value[i].string]);
    }
    for (var i=0,ilen=data.content.length;i<ilen;i++) {
        data.content[i].node.innerHTML = i18nStrings[data.content[i].string];
    }
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function fixPath (path) {
    var match = RegExp('https?://[^/]*/(.*?)([?#]|$)').exec(window.location.href);
    // If a stub exists, assume secure operation, so:
    var stub =  match && match[1];
    if (stub) {
        //   (1) remove &admin= value from URL
        path = path.replace(/(\?)(?:admin=[^&]*)*(.*?)(?:&admin=[^&]*)*/,'$1$2');
        //   (2) if URL begins with '/?', append stub to '/'
        path = path.replace(/^(\/)(\?)/, '$1' + stub + '$2');
        //   (3) remove any port designation from URL
        path = path.replace(/(https?:\/\/[^\/]*):[0-9]+/, '$1');
    }
    return path;
}

function apiRequest (url, obj, returnAsString) {
    url = fixPath(url);
    if ("object" === typeof obj) {
        obj = JSON.stringify(obj);
    } else if (!obj) {
        obj = null;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-type","application/json");
    xhr.send(obj);
    if (xhr.getResponseHeader('content-type') === 'text/html') {
        document = xhr.responseXML;
    }
    if (200 != xhr.status) {
        return false;
    }
    var ret = xhr.responseText;
    if (!returnAsString) {
        ret = JSON.parse(ret);
    }
    return ret;
}

function markdown (txt) {
    if (!txt) return '<p>&nbsp;</p>';
    txt = txt.replace(/(:-?\))/g,'(\u0298\u203f\u0298)');
    txt = txt.replace(/(:-\/)/g,'_(\u0361\u0e4f\u032f\u0361\u0e4f)_');
    txt = txt.replace(/^>>>\s+(.*)/,'__Rule\u21b4__\n\n>>> $1');
    txt = txt.replace(/^>>\s+(.*)/,'__Pattern\u21b4__\n\n>> $1');
    txt = txt.replace(/^>\s+(.*)/,'__Explanation\u21b4__\n\n> $1');
    txt = txt.replace(/\(\(([a-zA-Z1-9])\s+(.*?)\)\)/g, '<span class="quizzer-highlight">(($1)) $2</span>');
    txt = txt.replace(/\(\(([a-zA-Z1-9])\)\)/g, function (aChar) {
        var c, val, offset;
        if (aChar[2].match(/[a-z]/)) {
            val = (aChar.charCodeAt(2) - 97)
            offset = 9424;
        } else if (aChar[2].match(/[A-Z]/)) {
            val = (aChar.charCodeAt(2) - 65)
            offset = 9398;
        } else {
            val = (aChar.charCodeAt(2) - 49)
            offset = 9312;
        }
        return String.fromCharCode(val + offset);
    });
    return marked.parse(txt);
}

function confirmDelete (node,callbackName) {
    var origValue,origEvent;
    if (node.value) {
        origValue = node.value;
        node.value= i18nStrings["delete-query"];
    } else {
        origValue = node.innerHTML;
        node.innerHTML = i18nStrings["delete-query"];
    }
    var origEvent = '' + node.getAttribute('onclick');
    var origStyle = node.parentNode.style;
    node.style.color = 'red';
    node.setAttribute('onclick', callbackName + '(this)');
    setTimeout(function() {
        if (node.value) {
            node.value = origValue;
        } else {
            node.innerHTML = origValue;
        }
        node.style = origStyle;
        node.setAttribute('onclick',origEvent);
    },2000);
}

function getLanguages (ruleGroupID) {
    var groupid;
    if (ruleGroupID) {
        groupid = '&groupid=' + ruleGroupID
    } else {
        groupid = '';
    }
    var adminID = getParameterByName('admin');
    var languages = apiRequest(
        '/?admin='
            + adminID
            + '&page=students'
            + '&cmd=getlanguages'
            + groupid
    );
    if (false === languages) return [];
    return languages;
};

function installLanguages (clickable) {
    var languages;
    if (clickable) {
        var ruleGroupID = getParameterByName('groupid');
        languages = getLanguages(ruleGroupID);
    } else {
        var languages = getLanguages();
    }
    var languagesNode = document.getElementById('languages');
    for (var i=0,ilen=languagesNode.childNodes.length;i<ilen;i+=1) {
        languagesNode.removeChild(languagesNode.childNodes[0]);
    }
    for (var i=0,ilen=languages.length;i<ilen;i+=1) {
        var language = languages[i];
        var languageNode = document.createElement('span');
        if (!clickable) {
            languageNode.setAttribute("draggable",'true');
            languageNode.setAttribute('ondragstart', 'dragLang(event)');
        } else {
            // Check each language for completeness
            //   complete: green background + clickable
            //   partial: yellow background + clickable
            //   empty: no background, not clickable
            if (language.completeness) {
                languageNode.setAttribute("onclick", "downloadRules('" + language.lang + "','" + language.langName + "')");
                if (language.completeness === 2) {
                    languageNode.classList.add("complete");
                } else if (language.completeness === 1) {
                    languageNode.classList.add("partial");
                }
            }
        }
        languageNode.id = language.lang;
        languageNode.innerHTML = language.langName;
        languagesNode.appendChild(languageNode);
        var space = document.createTextNode(' ');
        languagesNode.appendChild(space);
    }
};
