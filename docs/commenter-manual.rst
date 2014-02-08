=======
Quizzer
=======
---------------------
Manual for Commenters
---------------------


.. contents::

#############################
Comments in the Quizzer cycle
#############################

Comments are shown to students who make specific mistakes in a quiz.
A quiz helps a student to engage actively with grammatical patterns,
and the examination to follow provides an added motivation for study.
Comments are a primary reference for students striving to improve
their sense of grammar and style.

Comments are provided to multiple students, most of whom were not the
author of the text on which the question content was based. To avoid
confusion, it is best to refer to the author of a mistake in the third
person in comments, as "the author" or "the writer".

######
Access
######

Each commenter has a unique personal link to their editing page. Commenters
receive a reminder mail once each week, on the day of the week set in the
administrator's **Commenters** configuration page. As a security measure,
the link changes each time the reminder mail is sent.

The top-level commenter editing page shows one or more **Gloss**
buttons for editing style and grammar rules, and a list of courses
(with a parenthetical indication of the number of uncommented quiz
mistakes in each). By navigating downward to a course, then to a quiz,
the commenter can reach the lists of quiz mistakes.

##############
Comment syntax
##############

Comments use the *Markdown* syntax, a simple plain text markup format
commonly used for blog comments and online bulletin boards. A few
extensions have been added to the basic syntax, for commenting on
grammatical issues (an explanation of basic *Markdown* is available
`here`__ -- the 'inline HTML' section describes the forms for
*italics* and **boldface**).

__ http://daringfireball.net/projects/markdown/syntax

^^^^^^^^^^^^^^^^
Setting examples
^^^^^^^^^^^^^^^^

Use the **e.g.** button to add the text of the mistaken answer at the top of an empty comment.
(this button has no effect when there is already text in the comment box)::

    > There is only one regulations.

^^^^^^^^^^^^^^^^
Numbered markers
^^^^^^^^^^^^^^^^

Numbered markers can be added to an example by enclosing a single letter or number in double
paretheses::

    ((a))

These will be converted to their circled equivalents when the comment is saved.

^^^^^^^^^^^^^^
Numbered spans
^^^^^^^^^^^^^^

A span of text can be marked for commenting by moving the closing double parentheses to
the end of the span::

    There is only ((1 one regulations)).

A numbered marker will be inserted, and highlighted together with the span of text.

^^^^^^^^^^^^^^^^
Setting patterns
^^^^^^^^^^^^^^^^

The single greater-than symbol inserted by the **e.g.** button will render as an
indented block highlighted in red. This represents a "bad" example.

To show a "good" example, use to two greater-than symbols::

    >> There is only one regulation.

The indented block will be highlighted in green.

#####
Rules
#####

To add a rule flagging a common issue that is not yet covered by the pulldown list
of rules (see below), use three greater-than symbols in a comment::

    >>> Verbs: avoid using passive verb forms

It is best practice to begin a rule with a catch-word to permit rapid searching in
the pulldown list. The rule text can be edited later, so it is not necessary to fret too
much over the exact phrasing.

If a rule is set at the very top of a comment, it will be removed from the comment
and added as a separate "rule" comment. Otherwise, it will appear in the comment
as an indented box with white background. In either case, the rule is immediately
made available in the pulldown list for subsequent comments.

^^^^^^^
Glosses
^^^^^^^

To add an explanation or examples to a rule, visit the top-level commenter editing
page and click on the **Gloss** button for a given language. Clicking on a rule
will open it for editing. After saving, the explanatory text will be shown to
students who are fluent in the target language.

The headline text itself can be edited only for rules owned by the current commenter.
The headline text of shared rules cannot be edited: the rule must first be delegated
to an individual commenter by the administrator.
