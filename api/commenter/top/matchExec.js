(function () {
    var cogClass = function () {};
    cogClass.prototype.match = function (params) {
        return (this.sys.validCommenter(params)
                && !params.cmd
                && (!params.page || params.page === 'top'));
    };
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var commenter = this.sys.validCommenter(params);
        var myPage = this.page.toString().replace(/@@COMMENTER@@/g, commenter);
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(myPage);
    }
    exports.cogClass = cogClass;
})();
