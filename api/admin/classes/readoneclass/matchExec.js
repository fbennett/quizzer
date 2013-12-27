(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        this.sys.db.get('SELECT classID,name FROM classes WHERE classID=?',[params.classid],function(err,row){
            if (err||!row) {return oops(response,err,'classes/readoneclass')};
            var obj = {classid:row.classID,name:row.name}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(obj));
        });
    }
    exports.cogClass = cogClass;
})();
