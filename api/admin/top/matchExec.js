(function () {
    var cogClass = function () {};
    cogClass.prototype.match = function (params) {
        return (this.sys.validAdmin(params)
                && (!params.page || params.page === 'top'));
    };
    cogClass.prototype.exec = function (params, request, response) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(this.page)
    }
    exports.cogClass = cogClass;
})();
