function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function addStudent() {
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    var studentID = document.getElementById('student-id');
    if (studentID.value) {
        studentID.disabled = true;
    } else {
        studentID.disabled = false;
    }
    addButton.setAttribute('hidden', true);
    saveButton.removeAttribute('hidden');
    studentBoxes.removeAttribute('hidden');
}

function editStudent(node) {
    // Read out student details from node, write to edit panel,
    // and run addStudent()
    // The HTML will need a node for the student ID for
    // this to work right. It should be editable only for
    // newly-created entries. After that, it should stick.
    // There will be consistency problems only where
    // a student reports under two separate email
    // addresses, and we add him/her without picking up
    // the duplicate. Not much you can do there. Things
    // happen.
}

function saveStudent() {
    // Need to add student ID, for edits
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    var studentName = document.getElementById('student-name');
    var studentEmail = document.getElementById('student-email');
    var studentID = document.getElementById('student-id');
    // Values
    var name = studentName.value;
    var email = studentEmail.value;
    var id = studentID.value;
    if (name && email) {
        // Save
        var adminID = getParameterByName('admin');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/?admin='+adminID+'&cmd=addstudent', false);
        xhr.setRequestHeader("Content-type","application/json");
        xhr.send(JSON.stringify({email:email,name:name}));
        buildStudentList();
    }
    if ((name && email) || (!name && !email && !id)) {
        // Clear
        studentName.value = null;
        studentEmail.value = null;
        // Redecorate
        addButton.removeAttribute('hidden');
        saveButton.setAttribute('hidden', true);
        studentBoxes.setAttribute('hidden', true);
    } else {
        alert("Both name and email are required");
    }
}

function buildStudentList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var adminID = getParameterByName('admin');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/?admin='+adminID+'&cmd=readstudents', false);
        xhr.setRequestHeader("Content-type","text/plain");
        xhr.overrideMimeType("application/json"); 
        xhr.send(null);
        var rows = JSON.parse(xhr.responseText);
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
        var nameText = document.createTextNode(rows[i][0]);
        var emailText = document.createTextNode(rows[i][1]);
        var tr = document.createElement('tr');
        var nameTD = document.createElement('td');
        var emailTD = document.createElement('td');
        nameTD.appendChild(nameText);
        tr.appendChild(nameTD);
        emailTD.appendChild(emailText);
        tr.appendChild(emailTD)
        container.appendChild(tr);
    }
    // Each student line should have an edit button
}
