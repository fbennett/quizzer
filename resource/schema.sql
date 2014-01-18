-- 9

CREATE TABLE version (
       schema TEXT PRIMARY KEY,
       version INT NOT NULL
);
CREATE INDEX schema ON version(schema);

CREATE TABLE admin (
       adminID INTEGER PRIMARY KEY,
       name TEXT,
       adminKey TEXT,
       role INTEGER,
       interval INTEGER,
       email TEXT
);
CREATE UNIQUE INDEX admin_key_idx ON admin(adminKey);
CREATE UNIQUE INDEX admin_name_idx ON admin(name);

CREATE TABLE students (
       studentID INTEGER PRIMARY KEY,
       name TEXT,
       email TEXT,
       privacy INTEGER DEFAULT 0,
       lang TEXT DEFAULT 'en'
);

CREATE TABLE classes (
       classID INTEGER PRIMARY KEY,
       name TEXT
);

CREATE TABLE memberships (
       membershipID INTEGER PRIMARY KEY,
       classID INTEGER,
       studentID INTEGER,
       studentKey TEXT,
       last_mail_date DATE
);

CREATE TABLE showing (
       showID INTEGER PRIMARY KEY,
       adminID INTEGER,
       classID INTEGER,
       studentID INTEGER
);
CREATE UNIQUE INDEX showing_idx ON showing(adminID,classID,studentID);

CREATE TABLE quizzes (
       quizID INTEGER PRIMARY KEY,
       classID INTEGER,
       quizNumber INTEGER,
       sent BOOLEAN,
       examName TEXT,
       examDate TEXT
);
CREATE UNIQUE INDEX quizzes_idx ON quizzes(classID,quizNumber);

CREATE TABLE questions (
       questionID INTEGER PRIMARY KEY,
       classID INTEGER,
       quizNumber INTEGER,
       questionNumber INTEGER,
       correct INTEGER,
       rubricID INTEGER,
       qOneID INTEGER,
       qTwoID INTEGER,
       qThreeID INTEGER,
       qFourID INTEGER
);
CREATE UNIQUE INDEX questions_idx ON questions(classID,quizNumber,questionNumber);

CREATE TABLE strings (
       stringID INTEGER PRIMARY KEY,
       string TEXT
);
CREATE UNIQUE INDEX strings_idx ON strings(string);

CREATE TABLE answers(
       answerID INTEGER PRIMARY KEY AUTOINCREMENT,
       questionID INTEGER,
       studentID INTEGER,
       choice INTEGER
);
CREATE UNIQUE INDEX answers_idx ON answers(questionID,studentID,choice);

CREATE TABLE comments (
       commentID INTEGER PRIMARY KEY,
       classID INTEGER,
       quizNumber INTEGER,
       questionNumber INTEGER,
       choice INTEGER,
       commentTextID INTEGER,
       commenterID INTEGER
);
CREATE UNIQUE INDEX comments_idx ON comments(classID,quizNumber,questionNumber,choice,commenterID);
