# Quizzer

A simple, lightweight, low-security quiz engine implemented in JavaScript, with a
node.js backend.

--------------------

Initial code based on a sample posted by Chetan Jain:

  http://chetan0389.blogspot.jp/2013/06/quiz-using-htmlcss-jquery-xml-javascript.html


Okay, so what are we after here ...

## Operations

##Disk files

  * Administrators (CSV): ID, key
  * Classes (CSV): Name, ID
  * Students (CSV): Name, email, ID, key [supplied if not present]
  * Results: (class/student+question).json

## Screens

  * Admin:
    * Top-level: add course / delete courses / edit course / student menu
    * Student-admin: add student / disable-enable student / edit student
    * Course-level: add quiz / delete quizes / edit quiz / add student / disable-enable student
    * Quiz-level
      * add question / delete questions / edit question
      * send quiz links to students
      * view results

  * Student:
    * Quiz engine cycle only. One shot and out per question, no time limit.
