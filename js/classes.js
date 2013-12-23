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
        apiRequest(
            '/?admin='
                + adminID 
                + '&page=classes'
                + '&cmd=addclass'
            , {
                name:name,
                classid:id
            });
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
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'Edit');
        button.setAttribute('onclick', 'addClass(this.parentNode)');
        button.setAttribute('class', 'button-small');
        tr.appendChild(button);
        container.appendChild(tr);
    }
    // Each class line should have an edit button
}
