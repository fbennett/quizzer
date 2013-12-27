(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        this.sys.db.get('SELECT studentID,name,email FROM students WHERE studentID=?',[params.studentid],function(err,row){
            if (err||!row) {return oops(response,err,'students/readonestudent')};
            var obj = {classid:row.classID,name:row.name,email:row.email}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(obj));
        });
    }
    exports.cogClass = cogClass;
})();
