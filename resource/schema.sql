-- 3

CREATE TABLE IF NOT EXISTS admin (
       adminID INTEGER PRIMARY KEY,
       name TEXT,
       adminKey TEXT,
       role INTEGER,
       interval INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS admin_key_idx ON admin(adminKey);
CREATE UNIQUE INDEX IF NOT EXISTS admin_name_idx ON admin(name);

CREATE TABLE IF NOT EXISTS students (studentID INTEGER PRIMARY KEY,name TEXT,email TEXT,privacy INTEGER DEFAULT 0, lang TEXT DEFAULT 'en');

CREATE TABLE IF NOT EXISTS classes (classID INTEGER PRIMARY KEY,name TEXT);

CREATE TABLE IF NOT EXISTS memberships (membershipID INTEGER PRIMARY KEY,classID INTEGER,studentID INTEGER, studentKey TEXT);

CREATE TABLE IF NOT EXISTS quizzes (quizID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, sent BOOLEAN, examName TEXT, examDate TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS quizzes_idx ON quizzes(classID,quizNumber);

CREATE TABLE IF NOT EXISTS questions (questionID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, correct INTEGER, rubricID INTEGER, qOneID INTEGER, qTwoID INTEGER, qThreeID INTEGER, qFourID INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS questions_idx ON questions(classID,quizNumber,questionNumber);

CREATE TABLE IF NOT EXISTS answers (answerID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, studentID INTEGER, choice INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS answers_idx ON answers(classID,quizNumber,questionNumber,studentID,choice);

CREATE TABLE IF NOT EXISTS comments(
  commentID INT PRIMARY KEY,
  classID INT,
  quizNumber INT,
  questionNumber INT,
  choice INT,
  commentTextID INT,
  commenterID INT
);
CREATE UNIQUE INDEX comments_idx ON comments(classID,quizNumber,questionNumber,choice,commenterID);


CREATE TABLE IF NOT EXISTS comments (commentID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, choice INTEGER, commentTextID INTEGER,commenter TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS comments_idx ON comments(classID,quizNumber,questionNumber,choice,commenter);

CREATE TABLE IF NOT EXISTS showing (showID INTEGER PRIMARY KEY, adminID INTEGER, classID INTEGER, studentID INTEGER);

CREATE TABLE IF NOT EXISTS strings (stringID INTEGER PRIMARY KEY, string TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS strings_idx ON strings(string);

