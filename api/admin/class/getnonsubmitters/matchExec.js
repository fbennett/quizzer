(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var sql = 'SELECT name,group_concat(nonsub.quizNumber, ", ") AS quizzes,email,COUNT(nonsub.quizNumber) AS count '
            + 'FROM memberships '
            + 'NATURAL JOIN students '
            + 'JOIN ('
            +   'SELECT DISTINCT quizNumber,memberships.studentID '
            +   'FROM memberships '
            +   'NATURAL JOIN classes '
            +   'JOIN quizzes USING(classID) '
            +   'JOIN questions USING(quizID) '
            +   'LEFT JOIN answers USING(questionID,studentID) '
            +   'WHERE classes.classID=? AND answers.questionID IS NULL AND sent=1 AND examName IS NULL '
            +   'GROUP BY quizNumber,memberships.studentID '
            +   'ORDER BY quizNumber '
            + ') AS nonsub '
            + 'ON nonsub.studentID=students.studentID '
            + 'WHERE memberships.classID=? AND (privacy IS NULL OR privacy=0) '
            + 'GROUP BY students.name '
            + 'ORDER BY count DESC';
        sys.db.all(sql,[classID,classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'getnonsubmitters(1)')}
            var lst = [];
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                //console.log("GOT: "+row.name+" / "+row.quizzes+" / "+row.email);
                var obj = {name:row.name,quizzes:row.quizzes,email:row.email};
                lst.push(obj);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(lst));
        });
    }
    exports.cogClass = cogClass;
})();
