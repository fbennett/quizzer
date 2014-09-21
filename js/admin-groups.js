var pageData = {};

function addGroup(node) {
    // Does double duty as the edit function
    var addButton = document.getElementById('add-group-button');
    var saveButton = document.getElementById('save-group-button');
    var groupBoxes = document.getElementById('group-boxes');
    var groupName = document.getElementById('group-name');
    var groupID = document.getElementById('group-id');
    if (node) {
        var name = node.childNodes[0].textContent;
        var id = node.childNodes[1].textContent;
        groupName.value = name;
        groupID.value = id;
    }
    if (groupID.value) {
        groupID.disabled = true;
    } else {
        groupID.disabled = false;
    }
    addButton.style.display = 'none';
    saveButton.style.display = 'inline';
    groupBoxes.style.display = 'inline';
}

function saveGroup() {
    // Need to add group ID, for edits
    var addButton = document.getElementById('add-group-button');
    var saveButton = document.getElementById('save-group-button');
    var groupBoxes = document.getElementById('group-boxes');
    var groupName = document.getElementById('group-name');
    var groupID = document.getElementById('group-id');
    // Values
    var name = groupName.value;
    var id = groupID.value;
    if (name) {
        // Save
        var adminID = getParameterByName('admin');
        var rows = apiRequest(
            '/?admin='
                + adminID 
                + '&page=groups'
                + '&cmd=addgroup'
            , {
                name:name,
                groupid:id
            });
        if (false === rows) return;
        buildGroupList(rows);
    }
    if (name || (!name && !id)) {
        // Clear
        groupName.value = null;
        groupID.value = null;
        // Redecorate
        addButton.style.display = 'inline';
        saveButton.style.display = 'none';
        groupBoxes.style.display = 'none';
    } else {
        alert("A name is required");
        // Restore from server
        var adminID = getParameterByName('admin');
        var obj = apiRequest(
            '/?admin='
                + adminID
                + '&page=groups'
                + '&cmd=readonegroup'
            , {
                groupid:id
            });
        if (false === obj) return;
        groupName.value = obj.name;
    }
}

function buildGroupList (rows) {
    var adminID = getParameterByName('admin');
    if (!rows) {
        // if rows is nil, call the server.
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=groups'
                + '&cmd=readgroups'
        );
        if (false === rows) return;
    }
    // Delete children from container
    var container = document.getElementById('group-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var nameText = document.createTextNode(rows[i].name);
        var idText = document.createTextNode(rows[i].ruleGroupID);
        var tr = document.createElement('tr');
        var nameAnchor = document.createElement('a');
        var nameTD = document.createElement('td');
        var idTD = document.createElement('td');
        nameAnchor.appendChild(nameText);
        nameAnchor.setAttribute('href', fixPath('/?admin=' + adminID + '&page=rules&groupid=' + rows[i].ruleGroupID));
        nameTD.appendChild(nameAnchor);
        tr.appendChild(nameTD);
        idTD.appendChild(idText);
        idTD.style.display = 'none';
        tr.appendChild(idTD)
        // Edit button
        var buttonTD = document.createElement('td');
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('name', 'value-edit');
        button.setAttribute('value', 'Edit');
        button.setAttribute('onclick', 'addGroup(this.parentNode.parentNode)');
        button.setAttribute('class', 'button-small i18n');
        buttonTD.appendChild(button);
        tr.appendChild(buttonTD);
        container.appendChild(tr);
    }
}

