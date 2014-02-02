(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var sql = 'INSERT OR IGNORE ';
        var commenterKey = params.commenterkey;
        var commenterID = sys.admin[commenterKey].id;
        var lang = params.lang;
        var sql = 'INSERT OR IGNORE INTO adminLanguages VALUES (NULL,?,?)'
        sys.db.run(sql,[commenterID,lang],function(err){
            if (err) {return oops(response,err,'commenters/setcommenterlanguage(1)')}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(['success']));
        });
    }
    exports.cogClass = cogClass;
})();
