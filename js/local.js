function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function addStudent() {
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    addButton.setAttribute('hidden', true);
    saveButton.removeAttribute('hidden');
    studentBoxes.removeAttribute('hidden');
}

function saveStudent() {
    var addButton = document.getElementById('add-student-button');
    var saveButton = document.getElementById('save-student-button');
    var studentBoxes = document.getElementById('student-boxes');
    var studentName = document.getElementById('student-name');
    var studentEmail = document.getElementById('student-email');
    // Values
    var name = studentName.value;
    var email = studentEmail.value;
    // Save
    var adminID = getParameterByName('admin');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/?admin='+adminID+'&cmd=addstudent', false);
    xhr.setRequestHeader("Content-type","application/json");
    xhr.send(JSON.stringify({email:email,name:name}));
    studentName.value = null;
    studentEmail.value = null;
    // Redecorate
    addButton.removeAttribute('hidden');
    saveButton.setAttribute('hidden', true);
    studentBoxes.setAttribute('hidden', true);
}

