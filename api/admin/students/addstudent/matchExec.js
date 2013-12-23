(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var payload = JSON.parse(request.POSTDATA);
        if (payload.studentid) {
            var name = payload.name;
            var email = payload.email;
            var db = this.sys.db;
            db.run('INSERT OR REPLACE INTO students VALUES (?,?,?,?)',[payload.studentid,payload.name,payload.email,0],function(err){
                if (err) console.log("Error in addstudent (1): "+err);
                sendStudents();
            })
        } else {
            var name = payload.name;
            var email = payload.email;
            var db = this.sys.db;
            db.run('INSERT INTO students VALUES (NULL,?,?,?)',[payload.name,payload.email,0],function(err){
                if (err) console.log("Error in addclass (3): "+err);
                sendStudents();
            });
        }
        // XXX This is a duplicate of students/readstudents
        function sendStudents () {
            db.all('SELECT classID,name FROM classes',function(err,rows){
                if (err) console.log("Error in addclass (4): "+err);
                var retRows = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var retRow = [row.name, row.email, row.studentID, 'somekey'];
                    retRows.push(retRow);
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(retRows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
