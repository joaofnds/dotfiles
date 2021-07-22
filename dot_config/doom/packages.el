;; -*- lexical-binding: t; -*-

(unpin! format-all)
(package! magit-delta)       ; Use Delta when displaying diffs in Magit
(package! tmux-pane)         ; Negivate seamlessly between tmux and emacs
(package! tree-sitter)       ; Parser generator tool and an incremental parsing library
(package! tree-sitter-langs) ; Populates global registries of grammars and queries
(package! string-inflection) ; underscore -> UPCASE -> CamelCase -> lowerCamelCase conversion of names
(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library.
(package! f)                 ; modern api for working with files and directories

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
