(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var db = this.sys.db;
        var payload = JSON.parse(request.POSTDATA);
        var sql = "SELECT s.name,s.studentID AS studentID,m.studentID AS enroled "
            + "FROM students AS s "
            + "LEFT JOIN ("
            +   "SELECT classID,studentID "
            +   "FROM memberships "
            +     "WHERE classID=?"
            + ") AS m ON m.studentID=s.studentID;"
        this.sys.db.all(sql,[payload.classid],function(err,rows) {
            var rowsets = [[],[]];
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var dataitem = {name:row.name,studentid:row.studentID};
                if (row.enroled) {
                    rowsets[0].push(dataitem);
                } else {
                    rowsets[1].push(dataitem);
                }
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rowsets));
        });
    }
    exports.cogClass = cogClass;
})();

