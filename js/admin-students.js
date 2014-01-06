function addStudent(node) {
    // Does double duty as the edit function
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    var studentName = document.getElementById('student-name');
    var studentEmail = document.getElementById('student-email');
    var studentID = document.getElementById('student-id');
    var studentStatus = document.getElementById('student-status');
    if (node) {
        var name = node.textContent;
        var email = node.getAttribute('alt');
        var id = node.getAttribute('id');
        var status = false;
        if (node.className && node.className.match(/private/)) {
            var status = 'private';
        };
        studentName.value = name;
        studentEmail.value = email;
        if (status) {
            studentStatus.checked = true;
        } else {
            studentStatus.checked = false;
        }
        studentID.value = id;
    }
    if (studentID.value) {
        studentID.disabled = true;
    } else {
        studentID.disabled = false;
    }
    addButton.style.display = 'none';
    saveButton.style.display = 'inline';
    studentBoxes.style.display = 'inline';
}

function saveStudent() {
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
    console.log("STATUS: "+status);
    name = name ? name.replace(/^\s+/,'').replace(/\s+$/,'') : '';
    email = email ? email.replace(/^\s+/,'').replace(/\s+$/,'') : '';
    var id = studentID.value;
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
                privacy:status
            });
        buildStudentList();
    }
    if ((name && email) || (!name && !email && !id)) {
        // Clear
        studentName.value = null;
        studentEmail.value = null;
        studentID.value = null;
        studentStatus.checked = false;
        // Redecorate
        addButton.style.display = 'inline';
        saveButton.style.display = 'none';
        studentBoxes.style.display = 'none';
    } else {
        alert("Both name and email are required");
        // Restore from server
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
        studentName.value = obj.name;
        studentEmail.value = obj.email;
        studentStatus.checked = obj.privacy;
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
        var nameSpan = document.createElement('span');
        nameSpan.innerHTML = rows[i][0];
        nameSpan.setAttribute('title',rows[i][1]);
        nameSpan.setAttribute('alt',rows[i][1]);
        nameSpan.setAttribute('id',rows[i][2]);
        if (rows[i][3]) {
            nameSpan.setAttribute('class','bubble private');
        } else {
            nameSpan.setAttribute('class','bubble');
        }
        nameSpan.setAttribute('onclick', 'addStudent(this)');
        container.appendChild(nameSpan);
        var space = document.createTextNode(' ');
        container.appendChild(space);
    }
    // Each student line should have an edit button
}
