;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library
(package! f)                 ; modern api for working with files and directories

(package! org-mac-link)      ; insert org-mode links to items selected in various mac apps
(package! org-appear)        ; automatic visibility of various org elements depending on cursor position

(package! tmux-pane          ; negivate seamlessly between tmux and emacs
  :recipe (:host github
           :repo "joaofnds/emacs-tmux-pane"
           :files ("tmux-pane.el")))

(package! emacs-tmux-runner  ; my port of christoomey/vim-tmux-runner
  :recipe (:host github
           :repo "joaofnds/emacs-tmux-runner"
           :files ("emacs-tmux-runner.el")
           :build (:not compile)))
