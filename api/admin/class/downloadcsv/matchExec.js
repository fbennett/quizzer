(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;
        var studentInfo = [];
        var sql = 'SELECT students.name,email,classes.name AS className '
            + 'FROM memberships '
            + 'NATURAL JOIN students '
            + 'JOIN classes USING(classID) '
            + 'WHERE classes.classID=? AND (privacy IS NULL OR privacy=0)'
        sys.db.all(sql,[classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/downloadcsv(1)')};
            var className = "Empty file";
            if (rows.length) {
                var className = rows[0].className;
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    studentInfo.push('"' + row.name + '","' + row.email + '"');
                }
            }
            response.writeHead(200, {'Content-Type': 'text/csv','Content-Disposition':'attachment; filename="' + className + ' (roster).csv"'});
            response.end(studentInfo.join('\n'));
        });
    }
    exports.cogClass = cogClass;
})();
