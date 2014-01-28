(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = sys.admin[params.commenter].id;
        var sql = 'SELECT adminLanguages.lang,languages.langName FROM adminLanguages JOIN languages ON languages.lang=adminLanguages.lang WHERE adminLanguages.adminID=?';
        sys.db.all(sql,[commenterID],function(err,rows){
            if (err) {return oops(response,err,'**classes/readrulelangs(1)')};
            if (rows && rows.length) {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rows));
            } else {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify([]));
            }
        });
    }
    exports.cogClass = cogClass;
})();
