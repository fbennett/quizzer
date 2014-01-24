(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterKey = params.commenterkey;
        var commenterID = sys.admin[commenterKey].id;
        var lang = params.lang;
        var sql = 'DELETE FROM adminLanguages WHERE adminID=? AND lang=?'
        sys.db.run(sql,[commenterID,lang],function(err){
            if (err) {return oops(response,err,'commenters/removecommenterlanguage(1)')}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(['success']));
        });
    }
    exports.cogClass = cogClass;
})();
