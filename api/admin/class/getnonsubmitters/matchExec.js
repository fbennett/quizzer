(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var sql = 'SELECT s.name,group_concat(nonsub.quizNumber, ", ") AS quizzes,s.email,COUNT(nonsub.quizNumber) AS count '
            + 'FROM students AS s '
            + 'JOIN memberships AS mm ON mm.studentID=s.studentID '
            + 'JOIN ('
            +   'SELECT DISTINCT qz.quizNumber,m.studentID '
            +   'FROM quizzes AS qz '
            +   'JOIN questions AS q '
            +     'ON q.classID=qz.classID AND q.quizNumber=qz.quizNumber '
            +   'JOIN memberships AS m '
            +     'ON m.classID=qz.classID '
            +   'LEFT JOIN answers AS a '
            +     'ON a.questionID=q.questionID '
            +     'AND a.studentID=m.studentID '
            +   'WHERE qz.classID=? AND a.questionID IS NULL AND qz.sent=1 AND qz.examName IS NULL '
            +   'GROUP BY qz.quizNumber,m.studentID '
            +   'ORDER BY qz.quizNumber '
            + ') AS nonsub '
            + 'ON nonsub.studentID=s.studentID '
            + 'WHERE mm.classID=? AND (s.privacy IS NULL OR s.privacy=0) '
            + 'GROUP BY s.name '
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
