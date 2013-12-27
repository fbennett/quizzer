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
    if (false === quizResults) return;
}

function buildQuestionsView () {
    if (!quizResults) {
        getQuizResults();
    }
    // Empty the node
    //
    // Print, in grid form, the following summary info:
    //   - Total responses, total students (excluding outsiders)
    //   - Total right, total questions
    //
    // Then maybe:
    //   - A bell curve of the class profile on this quiz
    //
    // Then print, in grid form, a list with the following:
    //   - The question number, with a hovering CSS reveal of the question text
    //   - The number of responding students who got it right
}

function buildStudentsView () {
}
