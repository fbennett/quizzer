function buildClassList (rows) {
    if (!rows) {
        // if rows is nil, call the server.
        var commenterID = getParameterByName('commenter');
        var rows = apiRequest(
            '/?commenter='
                + commenterID
                + '&page=top'
                + '&cmd=readclasses'
        );
        if (false === rows) return;
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
        nameAnchor.setAttribute('href', fixPath('/?commenter=' + commenterID + '&page=class&classid=' + rows[i][1]));
        nameTD.appendChild(nameAnchor);
        tr.appendChild(nameTD);
        idTD.appendChild(idText);
        idTD.style.display = 'none';
        tr.appendChild(idTD)
        container.appendChild(tr);
    }
}
