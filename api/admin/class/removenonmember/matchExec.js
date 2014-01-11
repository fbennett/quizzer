(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = this.sys.admin[params.admin].id;
        var classID = params.classid;
        var studentID = params.studentid;
        this.sys.db.run('DELETE FROM showing WHERE adminID=? AND classID=? AND studentID=?',[adminID,classID,studentID],function(err){
            if (err) {return oops(response,err,'class')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(['success']));
        });
    }
    exports.cogClass = cogClass;
})();
