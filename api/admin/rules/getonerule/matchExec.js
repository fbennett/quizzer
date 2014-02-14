(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var ruleID = params.ruleid;

        var sql = 'SELECT string AS origText FROM rules JOIN ruleTranslations USING(ruleID) WHERE lang=\'en\' AND ruleID=?;';
        sys.db.get(sql,[ruleID],function(err,row){
            if (err||!row) {return oops(response,err,'rules/getonerule(1)')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(row));
        });
    }
    exports.cogClass = cogClass;
})();
