(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var studentID = params.studentid;
        var name = params.name;
        var email = params.email;
        var lang = params.lang;
        var privacy = params.privacy ? 1 : 0;
        console.log("Got param: "+params.privacy);
        if (studentID) {
            var db = this.sys.db;
            db.run('INSERT OR REPLACE INTO students VALUES (?,?,?,?,?)',[studentID,name,email,privacy,lang],function(err){
                if (err) {return oops(response,err,'students/addstudent')};
                sendStudents();
            })
        } else {
            var db = this.sys.db;
            db.run('INSERT INTO students VALUES (NULL,?,?,?,?)',[name,email,privacy,lang],function(err){
                if (err) {return oops(response,err,'students/addstudent')};
                sendStudents();
            });
        }
        // XXX This is a duplicate of students/readstudents
        function sendStudents () {
            db.all('SELECT studentID,name,email,privacy,lang FROM students',function(err,rows){
                if (err||!rows) {return oops(response,err,'students/addstudent')};
                var retRows = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var retRow = [row.name, row.email, row.studentID, privacy,lang];
                    retRows.push(retRow);
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(retRows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
