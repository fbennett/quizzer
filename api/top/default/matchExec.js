(function () {
    var cogClass = function (sys, pageName, callName) {
        this.sys = sys;
        this.call = callName;
        this.page = sys.fs.readFileSync('./api/' + pageName + '/' + callName + '/page.html');
    };
    cogClass.prototype.match = function (params) {
        return true || (params.admin
                        && this.admin[params.admin]
                        && (!params.page || params.page === 'top'));
    };
    cogClass.prototype.exec = function (params, response) {
        console.log("Sending page");
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(this.page)
    }
    exports.cogClass = cogClass;
})();
