var languages;
function getLanguages () {
    var adminID = getParameterByName('admin');
    languages = apiRequest(
        '/?admin='
            + adminID
            + '&page=students'
            + '&cmd=getlanguages'
    );
    if (false === languages) return;
};

function showStudents () {
    var studentList = document.getElementById('student-list');
    studentList.style.display = 'block';
    var mainDisplayButton = document.getElementById('main-display-button');
    mainDisplayButton.style.display = 'none';
    var addButton = document.getElementById('add-student-button');
    addButton.style.display = 'inline';
};

function addStudent(node) {
    var bubbleOpen = document.getElementsByClassName('bubble-edit');
    if (!bubbleOpen || bubbleOpen.length === 0) {
        var addButton = document.getElementById('add-student-button');
        var saveButton = document.getElementById('save-student-button');
        var studentBoxes = document.getElementById('student-boxes');
        var languageNode = document.getElementById('student-language');
        languageNode.innerHTML = getLanguageOptions();
        addButton.style.display = 'none';
        saveButton.style.display = 'inline';
        studentBoxes.style.display = 'inline';
    }
}

function editStudent(node) {
    var studentBoxes = document.getElementById('student-boxes');
    var bubbleName = document.getElementById('bubble-name');
    if (studentBoxes.style.display === 'inline' || bubbleName) {
        return;
    }
    var editDiv = document.createElement('div');
    var name = node.textContent;
    var emailAndLang = node.getAttribute('alt');
    var email = emailAndLang.replace(/^(?:[a-z]{2}(?:-[A-Z]{2})*:)/,'');
    var langtag = emailAndLang.replace(/^([a-z]{2}(?:-[A-Z]{2})*):.*/,'$1');
    var id = node.getAttribute('id');
    var status = false;
    if (node.className && node.className.match(/private/)) {
        var status = 'private';
    };
    var checked = '';
    if (status) {
        checked = 'checked="true"';
    }
    var options = getLanguageOptions(langtag);
    editDiv.setAttribute('id',id);
    editDiv.setAttribute('class','bubble-edit');
    editDiv.innerHTML = '<b class="i18n" name="content-name-label">Name:</b><input id="bubble-name" type="text" size="15" value="' + name + '"/> '
        + '<b class="i18n" name="content-email-label">Email:</b><input id="bubble-email" type="text" size="18" value="' + email + '"/> '
        + '<b class="i18n" name="content-external-label">External:</b>' + '<input id="bubble-privacy" type="checkbox" ' + checked +'/> '
        + '<b class="i18n" name="content-language-label">Language:</b>'
        + '<select id="bubble-language">'
        + options
        + '</select> '
        + '<input class="i18n" name="value-cancel" type="button" value="Cancel" onclick="saveEditStudent(this.parentNode,true)"/>'
        + '<input class="i18n" name~"value-save" type="button" value="Save" onclick="saveEditStudent(this.parentNode)"/>'
    node.parentNode.replaceChild(editDiv,node);
    i18n(editDiv);
}

function getLanguageOptions(langtag) {
    var options = '';
    for (var i=0,ilen=languages.length;i<ilen;i+=1) {
        var lang = languages[i];
        var selected = '';
        if (lang.lang === langtag) {
            selected=' selected="true"';
        }
        options += '<option value="' + lang.lang + '"' + selected +'/>' + lang.langName + '</option>';
    }
    return options;
}

function saveAddStudent(node) {
    // Need to add student ID, for edits
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    var studentName = document.getElementById('student-name');
    var studentEmail = document.getElementById('student-email');
    var studentStatus = document.getElementById('student-status');
    var studentID = document.getElementById('student-id');
    // Values
    var name = studentName.value;
    var email = studentEmail.value;
    var status = studentStatus.checked;
    name = name ? name.replace(/^\s+/,'').replace(/\s+$/,'') : '';
    email = email ? email.replace(/^\s+/,'').replace(/\s+$/,'') : '';
    var id = studentID.value;

    var result = saveStudent(name,email,status,'en',id);

    if (result === 'empty' || result === 'done') {
        studentName.value = null;
        studentEmail.value = null;
        studentID.value = null;
        studentStatus.checked = false;
        // Redecorate
        addButton.style.display = 'inline';
        saveButton.style.display = 'none';
        studentBoxes.style.display = 'none';
    }
}

function saveEditStudent(node,cancel){
    var name = document.getElementById('bubble-name').value;
    var email = document.getElementById('bubble-email').value;
    var id = node.id;
    var privacy = document.getElementById('bubble-privacy').checked;
    var lang = document.getElementById('bubble-language').value;

    var result = 'done';
    if (!cancel) {
        result = saveStudent(name,email,privacy,lang,id);
    }

    if (result === 'done') {
        var newNode = castStudentNode([name,email,id,privacy,lang]);
        node.parentNode.replaceChild(newNode,node);
    } else {
        var adminID = getParameterByName('admin');
        var obj = apiRequest(
            '/?admin='
                + adminID
                + '&page=students'
                + '&cmd=readonestudent'
            , {
                studentid:id
            });
        if (false === obj) return;
        document.getElementById('bubble-name').value = obj.name;
        document.getElementById('bubble-email').value = obj.email;
    }        
}

function saveStudent(name,email,status,language,id) {
    name = name ? name.replace(/^\s+/,'').replace(/\s+$/,'') : '';
    email = email ? email.replace(/^\s+/,'').replace(/\s+$/,'') : '';
    if (name && email) {
        // Save
        var adminID = getParameterByName('admin');
        apiRequest(
            '/?admin='
                + adminID
                + '&page=students'
                + '&cmd=addstudent'
            , {
                email:email,
                name:name,
                studentid:id,
                lang:language,
                privacy:status
            });
        buildStudentList();
        return 'done';
    } else if (!name && !email && !id) {
        return 'empty';
    } else {
        alert('Both name and email are required');
        return 'partial';
    }
}

function buildStudentList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var adminID = getParameterByName('admin');
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=students'
                + '&cmd=readstudents');
        if (false === rows) return;
    }
    rows.sort(function (a,b) {
        // Sort by ???
        return a[0].localeCompare(b[0]);
    });
    // Delete children from container
    var container = document.getElementById('student-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var newNode = castStudentNode(rows[i]);
        container.appendChild(newNode);
        var space = document.createTextNode(' ');
        container.appendChild(space);
    }
}

function castStudentNode (row) {
    // Row is:
    // 0:name
    // 1:email
    // 2:id
    // 3:privacy
    // 4:lang
    var nameSpan = document.createElement('span');
    nameSpan.innerHTML = row[0];
    nameSpan.setAttribute('title',row[4] + ':' + row[1]);
    nameSpan.setAttribute('alt',row[4] + ':' + row[1]);
    nameSpan.setAttribute('id',row[2]);
    if (row[3]) {
        nameSpan.setAttribute('class','bubble private');
    } else {
        nameSpan.setAttribute('class','bubble');
    }
    nameSpan.setAttribute('onclick', 'editStudent(this)');
    return nameSpan;
}
