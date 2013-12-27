(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        if (params.studentid) {
            var name = params.name;
            var email = params.email;
            var db = this.sys.db;
            db.run('INSERT OR REPLACE INTO students VALUES (?,?,?,NULL,NULL)',[params.studentid,params.name,params.email],function(err){
                if (err) {return oops(response,err,'students/addstudent')};
                sendStudents();
            })
        } else {
            var name = params.name;
            var email = params.email;
            var db = this.sys.db;
            db.run('INSERT INTO students VALUES (NULL,?,?,NULL,NULL)',[params.name,params.email],function(err){
                if (err) {return oops(response,err,'students/addstudent')};
                sendStudents();
            });
        }
        // XXX This is a duplicate of students/readstudents
        function sendStudents () {
            db.all('SELECT classID,name FROM classes',function(err,rows){
                if (err||!rows) {return oops(response,err,'students/addstudent')};
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
