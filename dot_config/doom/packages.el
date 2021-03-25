;; -*- lexical-binding: t; -*-

(package! magit-delta)       ; Use Delta when displaying diffs in Magit
(package! prettier-js)       ; Use prettier to formar JavaScript files
(package! terraform-mode)    ; Major mode of terraform configuration file
(package! tmux-pane)         ; Negivate seamlessly between tmux and emacs
(package! evil-lion)         ; Evil align operator, port of vim-lion
(package! evil-numbers)      ; Increment and decrement numbers in Emacs
(package! tree-sitter)       ; Parser generator tool and an incremental parsing library
(package! tree-sitter-langs) ; Populates global registries of grammars and queries
(package! grip-mode)         ; Instant Github-flavored Markdown/Org preview using Grip
(package! php-mode)

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
