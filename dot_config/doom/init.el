;; -*- lexical-binding: t; -*-

(doom! :completion
       company            ; the ultimate code completion backend
       ivy                ; a search engine for love and life

       :ui
       doom               ; what makes DOOM look the way it does
       modeline           ; snazzy, Atom-inspired modeline, plus API

       :editor
       (evil +everywhere) ; come to the dark side, we have cookies

       :tools
       magit              ; a git porcelain for Emacs

       :lang
       emacs-lisp         ; drown in parentheses
       org                ; organize your plain life in plain text

       :config
       (default +bindings))
