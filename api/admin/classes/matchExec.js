(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var page = this.page;
        var oops = this.utils.apiError;
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(page);
    }
    exports.cogClass = cogClass;
})();
