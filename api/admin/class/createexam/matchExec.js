(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var examTitle = params.examtitle;
        var examDate = params.examdate;
        var examNumberOfQuestions = params.examnumberofquestions;
        console.log("Creating exam: title='"+examTitle+"', date='"+examDate+"', number-of-questions="+examNumberOfQuestions);
        
        // Okay
        //
        // Get all question IDs for this class that do no apply to an examination
        // (i.e. all that have sent=1 exactly set in the quizzes table)
        // (exams will have sent=-1 or sent=2)
        //
        // Randomize the list the question IDs
        //
        // Slice off the first N questions
        //
        // Get the questions in the exam
        //
        // For each question
        //   Generate its bar code
        //
        // Get a list of students in the class
        //
        // For each student
        //   Randomize the questions
        //   Build the LaTeX for the quiz and save to file
        //   Render the LaTeX to PDF and save to file
        //
        // Finally, bundle PDF, LaTeX and bar codes in
        // a zip file, and send to site administrator

        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify([]));

    }
    exports.cogClass = cogClass;
})();
