-- 17

CREATE TABLE version (
       schema TEXT PRIMARY KEY,
       version INT NOT NULL
);
CREATE INDEX version_idx ON version(schema);

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

CREATE TABLE languages (
       lang TEXT PRIMARY KEY,
       langName TEXT
);
INSERT INTO languages VALUES ('en','English');
INSERT INTO languages VALUES ('zh-CN','Chinese (cn)');
INSERT INTO languages VALUES ('zh-TW','Chinese (tw)');
INSERT INTO languages VALUES ('fr','French');
INSERT INTO languages VALUES ('id','Indonesian');
INSERT INTO languages VALUES ('it','Italian');
INSERT INTO languages VALUES ('ja','Japanese');
INSERT INTO languages VALUES ('km','Khmer');
INSERT INTO languages VALUES ('kr','Korean');
INSERT INTO languages VALUES ('la','Laotian');
INSERT INTO languages VALUES ('mn','Mongolian');
INSERT INTO languages VALUES ('my','Myanmar');
INSERT INTO languages VALUES ('pl','Polish');
INSERT INTO languages VALUES ('ru','Russian');
INSERT INTO languages VALUES ('th','Thai');
INSERT INTO languages VALUES ('uz','Uzbek');
INSERT INTO languages VALUES ('bn','Bengali');
INSERT INTO languages VALUES ('tr','Turkish');
INSERT INTO languages VALUES ('vn','Vietnamese');
INSERT INTO languages VALUES ('de','German');
INSERT INTO languages VALUES ('pt-BR','Portuguese (br)');

CREATE TABLE adminLanguages (
       adminLanguageID INTEGER PRIMARY KEY,
       adminID INTEGER,
       lang TEXT,
       UNIQUE(adminID,lang),
       FOREIGN KEY (adminID) REFERENCES admin(adminID),
       FOREIGN KEY (lang) REFERENCES languages(lang)
);

CREATE TABLE students (
       studentID INTEGER PRIMARY KEY,
       name TEXT,
       email TEXT,
       privacy INTEGER DEFAULT 0,
       lang TEXT DEFAULT 'en'
);

CREATE TABLE classes (
       classID INTEGER PRIMARY KEY,
       ruleGroupID INTEGER,
       name TEXT,
       FOREIGN KEY (ruleGroupID) REFERENCES ruleGroups(ruleGroupID)
);

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

CREATE TABLE choices (
       choiceID INTEGER PRIMARY KEY,
       questionID INTEGER,
       choice INTEGER,
       stringID INTEGER,
       UNIQUE (questionID,choice),
       FOREIGN KEY (questionID) REFERENCES questions(questionID),
       FOREIGN KEY (stringID) REFERENCES strings(stringID)
);

CREATE TABLE strings (
       stringID INTEGER PRIMARY KEY,
       string TEXT NOT NULL,
       UNIQUE (string)
);

CREATE TABLE quizAnswers (
       quizAnswerID INTEGER PRIMARY KEY,
       quizID INTEGER,
       studentID INTEGER,
       submissionDate DATE,
       UNIQUE(quizID,studentID),
       FOREIGN KEY (quizID) REFERENCES quizzes(quizID),
       FOREIGN KEY (studentID) REFERENCES students(studentID)
);

CREATE TABLE answers(
       answerID INTEGER PRIMARY KEY AUTOINCREMENT,
       questionID INTEGER,
       studentID INTEGER,
       choice INTEGER,
       FOREIGN KEY (questionID) REFERENCES questions(questionID)
);
CREATE UNIQUE INDEX answers_idx ON answers(questionID,studentID,choice);

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

CREATE TABLE ruleGroups (
       ruleGroupID INTEGER PRIMARY KEY,
       name TEXT NOT NULL,
       UNIQUE(name)
);
INSERT INTO ruleGroups VALUES (NULL,'English Composition');

CREATE TABLE rules (
       ruleID INTEGER PRIMARY KEY,
       ruleGroupID INTEGER,
       ruleStringID INTEGER,
       adminID INTEGER,
       FOREIGN KEY (ruleGroupID) REFERENCES ruleGroups(ruleGroupID),
       FOREIGN KEY (ruleStringID) REFERENCES ruleStrings(ruleStringID),
       FOREIGN KEY (adminID) REFERENCES admin(adminID)
);

CREATE TABLE ruleStrings (
       ruleStringID INTEGER PRIMARY KEY,
       string TEXT NOT NULL,
       UNIQUE (string)
);
CREATE UNIQUE INDEX rulestrings_idx ON ruleStrings(string);

CREATE TABLE ruleTranslations (
       ruleTranslationID INTEGER PRIMARY KEY,
       ruleID NOT NULL,
       string TEXT,
       lang TEXT NOT NULL,
       UNIQUE (ruleID,lang),
       FOREIGN KEY (ruleID) REFERENCES rules(ruleID)
);

CREATE TABLE ruleTranslationEdits (
       ruleTranslationEditID INTEGER PRIMARY KEY,
       ruleTranslationID INTEGER NOT NULL,
       studentID INTEGER,
       adminID INTEGER,
       editDate DATE,
       FOREIGN KEY (ruleTranslationID) REFERENCES ruleTranslations(ruleTranslationID),
       FOREIGN KEY (studentID) REFERENCES students(studentID)
);

CREATE TABLE rulesToChoices (
       ruleToChoiceID INTEGER PRIMARY KEY,
       choiceID INTEGER,
       ruleID INTEGER,
       UNIQUE (choiceID,ruleID),
       FOREIGN KEY (choiceID) REFERENCES choices(choiceID),
       FOREIGN KEY (ruleID) REFERENCES rules(ruleID)
);
