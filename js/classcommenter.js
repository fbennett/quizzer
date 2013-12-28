function buildQuizList (rows) {
    var adminID = getParameterByName('admin');
    var classID = getParameterByName('classid');
    var commenterID = getParameterByName('commenter');
    if (!rows) {
        // if rows is nil, call the server.
        var rows = apiRequest(
            '/?admin='
                + adminID
                + '&page=class'
                + '&commenter='
                + commenterID
                + '&cmd=readquizzes'
            , {
                classid:classID
            }
        );
        if (false === rows) return;
    }
    rows.sort(function (a,b) {
        a = parseInt(a.number,10);
        b = parseInt(b.number,10);
        if (a>b) {
            return 1;
        } else if (a<b) {
            return -1;
        } else {
            return 0;
        }
    });
    // Delete children from container
    var container = document.getElementById('quiz-list');
    for (var i=0,ilen=container.childNodes.length;i<ilen;i+=1) {
        container.removeChild(container.childNodes[0]);
    }
    // Rebuild container content
    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
        var nameText = document.createTextNode("Quiz "+rows[i].number);
        var idText = document.createTextNode(rows[i].number);
        var tr = document.createElement('tr');
        var nameAnchor = document.createElement('a');
        var nameTD = document.createElement('td');
        var idTD = document.createElement('td');
        nameAnchor.appendChild(nameText);

        nameAnchor.setAttribute('href', fixPath('/?admin=' + adminID + '&page=quiz&classid=' + classID + '&quizno=' + rows[i].number + '&commenter=' + commenterID));

        nameTD.appendChild(nameAnchor);
        tr.appendChild(nameTD);
        idTD.appendChild(idText);
        idTD.style.display = 'none';
        tr.appendChild(idTD)
        if (rows[i].numberOfCommentsNeeded) {
            var markerText = document.createTextNode('(' + rows[i].numberOfCommentsNeeded + ')');
            var markerTD = document.createElement('td');
            markerTD.appendChild(markerText);
            tr.appendChild(markerTD);
        }
        container.appendChild(tr);
    }
}
