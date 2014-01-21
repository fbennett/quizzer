-- 11

-- no changes
CREATE TABLE version (
       schema TEXT PRIMARY KEY,
       version INT NOT NULL
);
CREATE INDEX version_idx ON version(schema);

-- no changes
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

-- no changes
CREATE TABLE students (
       studentID INTEGER PRIMARY KEY,
       name TEXT,
       email TEXT,
       privacy INTEGER DEFAULT 0,
       lang TEXT DEFAULT 'en'
);

-- no changes
CREATE TABLE classes (
       classID INTEGER PRIMARY KEY,
       name TEXT
);

-- straight export, recreate, reimport
CREATE TABLE memberships (
       membershipID INTEGER PRIMARY KEY,
       classID INTEGER,
       studentID INTEGER,
       studentKey TEXT NOT NULL,
       last_mail_date DATE,
       UNIQUE (studentID,classID),
       FOREIGN KEY (studentID) REFERENCES students(studentID),
       FOREIGN KEY (classID) REFERENCES classes(classID)       
);

-- straight export, recreate, reimport
CREATE TABLE showing (
       showID INTEGER PRIMARY KEY,
       adminID INTEGER,
       classID INTEGER,
       studentID INTEGER,
       UNIQUE (adminID,classID,studentID),
       FOREIGN KEY (adminID) REFERENCES admin(adminID),
       FOREIGN KEY (classID) REFERENCES classes(classID),
       FOREIGN KEY (studentID) REFERENCES students(studentID)       
);

-- straight export, recreate, reimport
CREATE TABLE quizzes (
       quizID INTEGER PRIMARY KEY,
       classID INTEGER,
       quizNumber INTEGER,
       sent BOOLEAN,
       examName TEXT,
       examDate TEXT,
       UNIQUE (classID,quizNumber),
       FOREIGN KEY (classID) REFERENCES classes(classID)
);

-- NEEDS quizid ADDED in export, reimport will drop fields
-- create temp, add field, set value, recreate table, reimport
CREATE TABLE questions (
       questionID INTEGER PRIMARY KEY,
       quizID INTEGER,
       questionNumber INTEGER,
       correct INTEGER,
       stringID INTEGER,
       UNIQUE (quizID,questionNumber),       
       FOREIGN KEY (quizID) REFERENCES quizzes(quizID),
       FOREIGN KEY (stringID) REFERENCES strings(stringID)
);

-- NEW TABLE, impacts comments
-- export temp with all parent fields, set questionID
-- then set choiceID in temp comments table using parent data
-- then reimport both tables
CREATE TABLE choices (
       choiceID INTEGER PRIMARY KEY,
       questionID INTEGER,
       choice INTEGER,
       stringID INTEGER,
       UNIQUE (questionID,choice),
       FOREIGN KEY (questionID) REFERENCES questions(questionID),
       FOREIGN KEY (stringID) REFERENCES strings(stringID)
);

-- no changes
CREATE TABLE strings (
       stringID INTEGER PRIMARY KEY,
       string TEXT NOT NULL,
       UNIQUE (string)
);

-- straight export, recreate, reimport
CREATE TABLE answers(
       answerID INTEGER PRIMARY KEY AUTOINCREMENT,
       questionID INTEGER,
       studentID INTEGER,
       choice INTEGER,
       FOREIGN KEY (questionID) REFERENCES questions(questionID)
);
CREATE UNIQUE INDEX answers_idx ON answers(questionID,studentID,choice);

-- NEEDS choiceID
-- create temp with choiceID field
-- set from temporary choices table
CREATE TABLE comments (
       commentID INTEGER PRIMARY KEY,
       choiceID INTEGER,
       adminID INTEGER,
       stringID INTEGER,
       UNIQUE (choiceID,stringID),
       FOREIGN KEY (choiceID) REFERENCES choices(choiceID),
       FOREIGN KEY (adminID) REFERENCES admin(adminID),
       FOREIGN KEY (stringID) REFERENCES strings(stringID)
);

-- NEW TABLE, no side effects
CREATE TABLE rules (
       ruleID INTEGER PRIMARY KEY,
       ruleStringID INTEGER,
       FOREIGN KEY (ruleStringID) REFERENCES ruleStrings(ruleStringID)
);

-- NEW TABLE, no side effects
CREATE TABLE ruleStrings (
       ruleStringID INTEGER PRIMARY KEY,
       string TEXT NOT NULL,
       UNIQUE (string)
);
CREATE UNIQUE INDEX rulestrings_idx ON ruleStrings(string);

-- NEW TABLE, no side effects
CREATE TABLE rulesToChoices (
       ruleToChoiceID INTEGER PRIMARY KEY,
       choiceID INTEGER,
       ruleID INTEGER,
       UNIQUE (choiceID,ruleID),
       FOREIGN KEY (choiceID) REFERENCES choices(choiceID),
       FOREIGN KEY (ruleID) REFERENCES rules(ruleID)
);
