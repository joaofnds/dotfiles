;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library.
(package! f)                 ; modern api for working with files and directories
(package! magit-delta)       ; use delta when displaying diffs in magit
(package! tmux-pane)         ; negivate seamlessly between tmux and emacs
(package! tree-sitter)       ; parser generator tool and an incremental parsing library
(package! tree-sitter-langs) ; populates global registries of grammars and queries
(package! string-inflection) ; underscore_case -> UPCASE -> camelCase -> PascalCase conversion of names
(package! org-roam)          ; rudimentary roam replica with org-mode

(unpin! format-all)

(disable-packages!
 haml-mode
 pug-mode
 slim-mode
 less-css-mode
 stylus-mode
 sws-mode
 rainbow-mode
 helm-css-scss
 coffee-mode
 skewer-mode)
