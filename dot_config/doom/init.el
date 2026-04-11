;; -*- lexical-binding: t; -*-

(doom! :completion
       (corfu +orderless)  ; complete with cap(f), cape and a flying feather!
       vertico             ; the search engine of the future

       :ui
       doom                ; what makes DOOM look the way it does
       modeline            ; snazzy, Atom-inspired modeline, plus API
       (popup +defaults)   ; tame sudden yet inevitable temporary windows
       (vc-gutter +pretty) ; vcs diff in the fringe
       workspaces          ; tab emulation, persistence & separate workspaces

       :editor
       (evil +everywhere)  ; come to the dark side, we have cookies
       parinfer            ; turn lisp into python, sort of

       :emacs
       ibuffer             ; interactive buffer management
       (undo +tree)        ; persistent, smarter undo for your inevitable mistakes

       :term
       vterm               ; the best terminal emulation in Emacs

       :tools
       magit               ; a git porcelain for Emacs
       tree-sitter         ; syntax and parsing, sitting in a tree...

       :lang
       emacs-lisp          ; drown in parentheses
       org                 ; organize your plain life in plain text

       :os
       (:if (featurep :system 'macos) macos)  ; improve compatibility with macOS

       :app
       (rss +org)          ; emacs as an RSS reader

       :config
       (default +bindings +smartparens))
