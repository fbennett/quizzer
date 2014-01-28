var pageData = {};

function buildRuleGroupsList () {
    var adminID = getParameterByName('admin');
    var rows = apiRequest(
        '/?admin='
            + adminID 
            + '&page=classes'
            + '&cmd=getrulegroups'
    );
    if (false === rows) return;
    var classRuleGroup = document.getElementById('class-rule-group');
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var group = document.createElement('option');
        group.setAttribute('value',row.ruleGroupID);
        group.innerHTML = row.name;
        classRuleGroup.appendChild(group);
    }
};


function addClass(node) {
    // Does double duty as the edit function
    var addButton = document.getElementById('add-class-button');
    var saveButton = document.getElementById('save-class-button');
    var classBoxes = document.getElementById('class-boxes');
    var className = document.getElementById('class-name');
    var classID = document.getElementById('class-id');
    var classRuleGroup = document.getElementById("class-rule-group");
    if (node) {
        className.value = node.childNodes[0].textContent;
        classID.value = node.childNodes[1].textContent;
        for (var i=0,ilen=classRuleGroup.childNodes.length;i<ilen;i+=1) {
            var group = classRuleGroup.childNodes[i];
            if (group.value == node.childNodes[3].textContent) {
                group.selected = true;
                break;
            }
        }
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
    var classRuleGroup = document.getElementById('class-rule-group');
    // Values
    var name = className.value;
    var id = classID.value;
    var ruleGroupID = classRuleGroup.value;
    if (name) {
        // Save
        var adminID = getParameterByName('admin');
        var rows = apiRequest(
            '/?admin='
                + adminID 
                + '&page=classes'
                + '&cmd=addclass'
            , {
                name:name,
                classid:id,
                groupid:ruleGroupID
            });
        if (false === rows) return;
        buildClassList(rows);
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
        if (false === obj) return;
        className.value = obj.name;
    }
}

function buildClassList (rows) {
    var adminID = getParameterByName('admin');
    if (!rows) {
        // if rows is nil, call the server.
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=classes'
                + '&cmd=readclasses'
        );
        if (false === rows) return;
    }
    // Delete children from container
    var container = document.getElementById('class-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var nameText = document.createTextNode(rows[i].name);
        var idText = document.createTextNode(rows[i].classID);
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><a href="' + fixPath('/?admin=' + adminID + '&page=class&classid=' + rows[i].classID) + '">' + rows[i].name + '</a></td>'
            + '<td style="display:none;">' + rows[i].classID + '</td>'
            + '<td>' + rows[i].ruleGroupName + '</td>'
            + '<td style="display:none;">' + rows[i].ruleGroupID + '</td>'
            + '<td><input class="button-small" type="button" value="Edit" onclick="addClass(this.parentNode.parentNode);"></td>'
        container.appendChild(tr);
    }
}

