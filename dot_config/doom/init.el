;; -*- lexical-binding: t; -*-

(doom! :completion
       company            ; the ultimate code completion backend
       (ivy               ; a search engine for love and life
        +icons)           ; enables file icons for counsel file searches

       :ui
       doom               ; what makes DOOM look the way it does
       modeline           ; snazzy, Atom-inspired modeline, plus API
       emoji              ; 🙂
       (popup +defaults)  ; tame sudden yet inevitable temporary windows
       vc-gutter          ; vcs diff in the fringe
       workspaces         ; tab emulation, persistence & separate workspaces
       neotree            ; a project drawer, like NERDTree for vim

       :editor
       (evil +everywhere) ; come to the dark side, we have cookies
       file-templates     ; auto-snippets for empty files
       fold               ; (nigh) universal code folding
       format             ; automated prettiness
       multiple-cursors   ; editing in many places at once
       (parinfer +rust)   ; turn lisp into python, sort of
       snippets           ; my elves. They type so I don't have to
       word-wrap          ; soft wrapping with language-aware indent

       :emacs
       ;; dired              ; making dired pretty [functional]
       electric           ; smarter, keyword-based electric-indent
       (ibuffer           ; interactive buffer management
        +icons)           ; enables filetype icons for buffers
       (undo              ; persistent, smarter undo for your inevitable mistakes
        +tree)
       vc                 ; version-control and Emacs, sitting in a tree

       :term
       vterm              ; the best terminal emulation in Emacs

       :tools
       (docker +lsp)
       (eval +overlay)    ; run code, run (also, repls)
       (lookup            ; navigate your code and its documentation
        +dictionary
        +offline)
       (lsp +peek)
       magit              ; a git porcelain for Emacs
       make               ; run make tasks from Emacs
       taskrunner         ; taskrunner for all your projects
       tree-sitter        ; syntax and parsing, sitting in a tree...

       :lang
       (clojure +lsp)     ; java with a lisp
       common-lisp        ; if you've seen one lisp, you've seen them all
       (elixir +lsp)      ; erlang done right
       emacs-lisp         ; drown in parentheses
       (go +lsp)          ; the hipster dialect
       (haskell +dante)   ; a language that's lazier than I am
       (javascript +lsp)  ; all(hope(abandon(ye(who(enter(here))))))
       json               ; At least it ain't XML
       (lua               ; one-based indices? one-based indices
        +fennel)          ; fennel language support
       (org               ; organize your plain life in plain text
        +dragndrop
        +journal
        +pandoc)
       (python +lsp)      ; beautiful is better than ugly
       (racket +lsp +xp)  ; a DSL for DSLs
       (ruby +lsp +rails) ; 1.step {|i| p "Ruby is #{i.even? ? 'love' : 'life'}"}
       (scheme            ; a fully conniving family of lisps
        +guile)
       (sh +lsp)          ; she sells {ba,z,fi}sh shells on the C xor
       web                ; the tubes
       (yaml +lsp)        ; JSON, but readable

       :os
       (:if IS-MAC macos) ; improve compatibility with macOS

       :app
       (rss +org)         ; emacs as an RSS reader

       :config
       (default +bindings +smartparens))
