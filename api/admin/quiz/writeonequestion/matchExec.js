(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var data = params.data;
        var sys = this.sys;
        var utils = this.utils;
        sys.db.serialize(function() {
            utils.writeQuestion(response,classID,quizNumber,questionNumber,data);
        });
    }
    exports.cogClass = cogClass;
})();
