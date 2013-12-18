var quizResults;

function getQuizResults () {
    quizResults = apiRequest(
        '/?admin='
            + adminID
            + '&cmd=quizresults'
        , {
            classid:classID,
            quizno:quizNumber
        }
        , false);
}

function buildQuestionsView () {
    if (!quizResults) {
        getQuizResults();
    }
    // Empty the node
    //
    // Print, in grid form, the following summary info:
    //   - Total responses, total non-responders
    //   - Total right, total questions
    // Then print, in grid form, a list with the following:
    //   - The question number, with a hover CSS reveal of the question text
    //   - The number of responding students who got it right
    // Then maybe:
    //   - A bell curve of the class profile on this quiz
}

function buildStudentsView () {
}
