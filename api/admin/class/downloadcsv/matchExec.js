(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;
        var studentInfo = [];
        console.log("ATTEMPTING DOWNLOAD FOR: "+classID);
        sys.db.all('SELECT s.name,s.email FROM memberships AS m JOIN students AS s ON s.studentID=m.studentID WHERE m.classID=? AND s.privacy=0',[classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/downloadcsv(1)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                studentInfo.push('"' + row.name + '","' + row.email + '"');
            }
            response.writeHead(200, {'Content-Type': 'text/csv'});
            response.end(studentInfo.join('\n'));
        });
    }
    exports.cogClass = cogClass;
})();
