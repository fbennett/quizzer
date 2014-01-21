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
    // Delete children from container
    var container = document.getElementById('class-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var row = rows[i];
        var numberOfCommentsNeeded = '';
        if (row.numberOfCommentsNeeded > 0) {
            numberOfCommentsNeeded = '(' + row.numberOfCommentsNeeded + ')'
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'
            + '<a href="' 
            + fixPath('/?commenter=' + commenterID + '&page=class&classid=' + rows[i].classID) + '">'
            + row.name 
            + '</a>'
            + '</td>'
            + '<td>' + numberOfCommentsNeeded + '</td>'
            + '<td style="display:none;">' + row.classID + '</td>'
        container.appendChild(tr);
    }
}
