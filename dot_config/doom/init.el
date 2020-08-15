;;; init.el -*- lexical-binding: t; -*-

(doom! :completion
       company           ; the ultimate code completion backend
       ivy               ; a search engine for love and life

       :ui
       doom              ; what makes DOOM look the way it does
       doom-dashboard    ; a nifty splash screen for Emacs
       fill-column       ; a `fill-column' indicator
       hl-todo           ; highlight TODO/FIXME/NOTE/DEPRECATED/HACK/REVIEW
       modeline          ; snazzy, Atom-inspired modeline, plus API
       ophints           ; highlight the region an operation acts on
       (popup +defaults)   ; tame sudden yet inevitable temporary windows
       vc-gutter         ; vcs diff in the fringe
       vi-tilde-fringe   ; fringe tildes to mark beyond EOB
       workspaces        ; tab emulation, persistence & separate workspaces

       :editor
       (evil +everywhere); come to the dark side, we have cookies
       file-templates    ; auto-snippets for empty files
       fold              ; (nigh) universal code folding
       format            ; automated prettiness
       multiple-cursors  ; editing in many places at once
       parinfer          ; turn lisp into python, sort of
       snippets          ; my elves. They type so I don't have to
       word-wrap         ; soft wrapping with language-aware indent

       :emacs
       dired             ; making dired pretty [functional]
       electric          ; smarter, keyword-based electric-indent
       ibuffer           ; interactive buffer management
       undo              ; persistent, smarter undo for your inevitable mistakes
       vc                ; version-control and Emacs, sitting in a tree

       :term
       vterm             ; the best terminal emulation in Emacs

       :checkers
       syntax            ; tasing you for every semicolon you forget
       spell             ; tasing you for misspelling mispelling
       grammar           ; tasing grammar mistake every you make

       :tools
       docker
       editorconfig      ; let someone else argue about tabs vs spaces
       (eval +overlay)   ; run code, run (also, repls)
       lookup            ; navigate your code and its documentation
       lsp
       macos             ; MacOS-specific commands
       magit             ; a git porcelain for Emacs
       make              ; run make tasks from Emacs
       pdf               ; pdf enhancements
       rgb               ; creating color strings
       tmux              ; an API for interacting with tmux

       :lang
       (clojure +lsp)    ; java with a lisp
       common-lisp       ; if you've seen one lisp, you've seen them all
       data              ; config/data formats
       (elixir +lsp)     ; erlang done right
       elm               ; care for a cup of TEA?
       emacs-lisp        ; drown in parentheses
       (go +lsp)         ; the hipster dialect
       (json +lsp)       ; At least it ain't XML
       (javascript +lsp) ; all(hope(abandon(ye(who(enter(here))))))
       markdown          ; writing docs for people to ignore
       (org +pretty)     ; organize your plain life in plain text
       (python +lsp)     ; beautiful is better than ugly
       (ruby +lsp +rails); 1.step {|i| p "Ruby is #{i.even? ? 'love' : 'life'}"}
       (sh +lsp)         ; she sells {ba,z,fi}sh shells on the C xor
       web               ; the tubes
       (yaml +lsp)              ; JSON, but readable

       :app
       irc               ; how neckbeards socialize
       (rss +org)        ; emacs as an RSS reader

       :config
       (default +bindings +smartparens))
