function buildQuestionList () {
    // Call for quiz questions
    // Randomize responses and affix response map to object
    // Randomize questions and set question map
    // Build HTML for each question, rendering text with markdown
    //   var txt = marked.parse("This is a *cat*, it is.");
}

function addQuestion () {
    // Add a question node and populate using openQuestion()
}

function openQuestion (questionNumber) {
    // If questionNumber present, call for JSON of question from server
    // Otherwise, create empty object
    // Create a node with object content
    // Returns the node
}

function closeQuestion (questionNumber) {
    // Rewrites current text-box node content as text nodes
    // Saves text-box content to object
    // Sends object to server for saving
}

