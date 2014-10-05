# Quizzer

A lightweight writing instruction tool

--------------------

## Overview

Quizzer is an online support tool for academic writing instruction.
It can be installed with a single command, requires no student IDs or
passwords, and works well with classes made up of students at varying
stages of language acquisition, and from diverse language backgrounds.

The basic concept is to use student writing as the basis for a flood
of pattern-recognition exercises, cast as online quizzes delivered by
email.  By raising the pace of iteration, the aim is to help students
internalize a sense of grammatical anomalies and stylistic
infelicities.

While Quizzer can be used to generate multiple-choice quizzes for
a variety of purposes, the workflow it was built for runs like this:

1. Students submit a 400-word essay once each week on an arbitrary
   topic.
2. The instructor selects representative errors of style and grammar
   from the submissions, and composes a multiple-choice question
   consisting of the student's own sentence, two alternatives that
   also contain errors, and a corrected version.
3. After constructing one question from each submitted essay, students
   are sent personalized links to the resulting quiz.
4. Students submit their responses, which are recorded on the Quizzer
   server. Students receive feedback immediately feedback on their
   incorrect responses. *Neither the essays nor the quiz results are
   assessed.*
5. Class commenters (TAs, instructors, and other experienced writers)
   post short explanations of why the wrong answers were wrong. Where
   appropriate, commenters from the students' own language domain can
   be brought in to provide supplementary native-language guidance.
6. Class commenters of the target language domain can set persistent
   "rules" on-the-fly to cover issues that arise frequently. These
   rules can then to set as comments on specific wrong answers, and
   they can be translated by native-language commenters, for reference
   by students of the same language domain.
7. When students revisit their quiz links, they will find
   their errors attached with explanatory rule, comments, and a list
   of classmates who answered the question correctly.
8. Students are given an assessed, paper-based, multiple-choice
   supplementary mid-term and final exam, consisting entirely of
   questions from the quizzes.

Quiz distribution, commenting, exam composition, and marking are all
managed by Quizzer. Paper tests are randomized as a hedge against
cheating, and marked with a barcode reader for quick assessment.

The initial inspiration for Quizzer was a small [code
sample](http://chetan0389.blogspot.jp/2013/06/quiz-using-htmlcss-jquery-xml-javascript.html)
posted by Chetan Jain. The code has been refactored and extended
considerably for this project, but I gratefully acknowledge the
starting point for this frolic. Hats off also to the developers of
`node.js`, and LaTeX and, well, everything else. Quizzer was built on
short notice to fill a critical need, and it has been a real pleasure
to see how quickly it could be brought together, and how smoothly
it could be extended.

## Requirements

Quizzer is a `node.js` module. To get the website running, the
minimum requirements are:

> * `npm` >=1.3.x
> * `node` >=0.10.x

In addition, the following external utilities are required
for the typesetting of exams:

> * `pandoc` >=1.11.x (preferably compiled with texmath support)
> * either `pdflatex`, or `platex` and `dvipdfmx` (the latter pair is needed
>   only if Japanese text must be handled)

LaTex (pLaTeX) documents created by Quizzer use the following
packages:

> * `makebarcode`
> * `marginnote`
> * `graphicx`
> * `tikz`
> * `ctable`
> * `float`
> * `hyphenat`
> * `amsmath`

Quizzer must have access to a mail transfer agent (MTA). This can
either be a `sendmail` instance running on the same server, or a mail
API to a service such as GMail.

With the above requirements in place, Quizzer can be run on a
workstation for initial trials, accessed via a port on `localhost`
(aka `127.0.0.1`). For production use, Quizzer should be placed behind
a webserver, such as `lighttpd` or `apache`. Instructions for setting
up the former are given below.

## Basic Installation

Install quizzer from the `npm` repository:

    npm install quizzer

Run the server by saving the following code to a file (say, `quizServer.js`):

    var qz = require('quizzer');
    qz.run();

Run the script from command line like this:

    node ./quizServer.js

The script will whinge on first run, asking for some essential
details:

    usage: quizServer.js [-h] [-v] [-H PROXY_HOSTNAME] [-Q QUIZZER_PATH]
                         [-p REAL_PORT] [-e EMAIL_ACCOUNT] [-s SMTP_HOST]
                         [-l LOCALE] [-P] [-E]
                         
    
    Quizzer, a quiz server
    
    Optional arguments:
      -h, --help            Show this help message and exit.
      -v, --version         Show program's version number and exit.
      -H PROXY_HOSTNAME, --proxy-hostname PROXY_HOSTNAME
                            Host name for external access
      -Q QUIZZER_PATH, --quizzer-path QUIZZER_PATH
                            Server path to quizzer (default: "/quizzer/")
      -p REAL_PORT, --real-port REAL_PORT
                            Port on which to listen for local connections
                            (defaults to 3498)
      -e EMAIL_ACCOUNT, --email-account EMAIL_ACCOUNT
                            Full username of email account (e.g. useme@gmail.com)
      -s SMTP_HOST, --smtp-host SMTP_HOST
                            SMTP host name (e.g. smtp.gmail.com)
      -l LOCALE, --locale LOCALE
                            Language locale for admin interface ("en" or "ja")
      -P, --use-platex      Use platex engine + dvipdfmx for PDF generation
      -E, --use-euc-jp      Convert input text from UTF8 to legacy EUC-JP 
                            encoding before LaTeX processing
      ERROR: must set option proxy_hostname
      ERROR: must set option email_account

To get Quizzer running, set `proxy_hostname` to `localhost` (or `127.0.0.1`), and
set `email_account` to your mail address (`me@mail.com` in the example below):

    node ./quizServer -H localhost -e me@mail.com

Quizzer will come up with a message like the following:

    Wrote config parameters to quizzer-3498.cfg
    Quizzer can now be run with the single option: -p 3498
    Message: no mypwd.txt file found, will use local Sendmail transport
    Using local Sendmail transport
    Admin URL: http://localhost:3498/?admin=179359xq
    Adding admin role
    Loaded class membership keys
    Woke up the mail schedulers
    Done. Ready to shake, rattle and roll!

The website can now be accessed at the URL reported in the fifth line.
(Note that the `admin` key is automatically generated, and will differ
from that shown in the example above.)

The database and configuration files are created in the directory from
which the script is run, named after the port number. The server can
be shut down with `CTRL-c` (`SIGINT`), and as the startup message
says, it can be restarted with the single option `-p <REAL_PORT>`

A full explanation of the remaining options will be added to this
README as time permits.

## Running Quizzer behind a Proxy

When `PROXY_HOSTNAME` is set to a fully qualified domain name
(e.g. `myschool.edu`), it will assume that it is being run behind a
reverse proxy, and adjust URLs accordingly. Quizzer itself has only
the thinnest concept of security, and should be run behind a proxy in
production (and preferably over SSL). Access to the administrator
display depends on a key set in the URL of a GET request. Rewrite
rules on the front-end web server should be used to assure that
attempts to set the key directly are rerouted through a
password-protected URL.

If `lighttpd` is used as the front-end server, and Quizzer is run from
a directory `quizzer` to which the server has access, configuration
settings like the following should do the trick:

    url.rewrite = (
      "^(?!/quizzer)(.*)\?admin=[^&]+(?:&(.*))*" => "/quizzer/admin.html$1?$2",
      "^(?!/quizzer)(.*)&admin=[^&]+(?:&(.*))*" => "/quizzer/admin.html$1&$2",
      "^/quizzer/admin.html$" => "/quizzer/admin.html?admin=fyvg19vx",
      "^/quizzer/admin.html\?(.*)$" => "/quizzer/admin.html?admin=fyvg19vx&$1"
    )
    
    $HTTP["host"] == "faculty.of.things.edu" {
      proxy.server = ( "/quizzer" => ( ( "host" => "127.0.0.1", "port" => 3498 ) ) )
    }
    
    auth.backend = "htdigest"
    auth.backend.htdigest.userfile = "/etc/lighttpd/lighttpd.user"
    
    auth.require = ( "/quizzer/admin.html" =>
      (
        "method" => "basic",
        "realm" => "Quiz Admin",
        "require" => "user=quizmaster"
      )
    )
    
