function addStudent(node) {
    // Does double duty as the edit function
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    var studentName = document.getElementById('student-name');
    var studentEmail = document.getElementById('student-email');
    var studentID = document.getElementById('student-id');
    if (node) {
        var name = node.childNodes[0].textContent;
        var email = node.childNodes[1].textContent;
        var id = node.childNodes[2].textContent;
        studentName.value = name;
        studentEmail.value = email;
        studentID.value = id;
    }
    if (studentID.value) {
        studentID.disabled = true;
    } else {
        studentID.disabled = false;
    }
    addButton.setAttribute('hidden', true);
    saveButton.removeAttribute('hidden');
    studentBoxes.removeAttribute('hidden');
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
        xhr.send(JSON.stringify({email:email,name:name,id:id}));
        buildStudentList();
    }
    if ((name && email) || (!name && !email && !id)) {
        // Clear
        studentName.value = null;
        studentEmail.value = null;
        studentID.value = null;
        // Redecorate
        addButton.removeAttribute('hidden');
        saveButton.setAttribute('hidden', true);
        studentBoxes.setAttribute('hidden', true);
    } else {
        alert("Both name and email are required");
        // Restore from server
        var adminID = getParameterByName('admin');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/?admin='+adminID+'&cmd=readonestudent', false);
        xhr.setRequestHeader("Content-type","application/json");
        //xhr.overrideMimeType("application/json"); 
        xhr.send(JSON.stringify({id:id}));
        var obj = JSON.parse(xhr.responseText);
        studentName.value = obj.name;
        studentEmail.value = obj.email;
    }
}

function buildStudentList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var adminID = getParameterByName('admin');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/?admin='+adminID+'&cmd=readstudents', false);
        xhr.setRequestHeader("Content-type","text/plain");
        //xhr.overrideMimeType("application/json"); 
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
        var idText = document.createTextNode(rows[i][2]);
        var tr = document.createElement('tr');
        var nameTD = document.createElement('td');
        var emailTD = document.createElement('td');
        var idTD = document.createElement('td');
        nameTD.appendChild(nameText);
        tr.appendChild(nameTD);
        emailTD.appendChild(emailText);
        tr.appendChild(emailTD)
        idTD.appendChild(idText);
        idTD.hidden = true;
        tr.appendChild(idTD)
        // Edit button
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'Edit');
        button.setAttribute('onclick', 'addStudent(this.parentNode)');
        tr.appendChild(button);
        container.appendChild(tr);
    }
    // Each student line should have an edit button
}
