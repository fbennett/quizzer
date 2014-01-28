(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var retRows = [];
        this.sys.db.all('SELECT name,ruleGroupID FROM ruleGroups',function(err,rows){
            if (err||!rows) {return oops(response,err,'groups/readgroups')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
