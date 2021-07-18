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
       ibuffer            ; interactive buffer management
       undo               ; persistent, smarter undo for your inevitable mistakes
       vc                 ; version-control and Emacs, sitting in a tree

       :term
       vterm              ; the best terminal emulation in Emacs

       :tools
       docker
       (eval +overlay)    ; run code, run (also, repls)
       lookup             ; navigate your code and its documentation
       (lsp +peek)
       (magit             ; a git porcelain for Emacs
        +forge)           ; a porcelain for managing issues and PRs

       :lang
       (clojure +lsp)     ; java with a lisp
       common-lisp        ; if you've seen one lisp, you've seen them all
       (elixir +lsp)      ; erlang done right
       emacs-lisp         ; drown in parentheses
       (go +lsp)          ; the hipster dialect
       (javascript +lsp)  ; all(hope(abandon(ye(who(enter(here))))))
       json               ; At least it ain't XML
       lua                ; one-based indices? one-based indices
       org                ; organize your plain life in plain text
       ;; (python +lsp)      ; beautiful is better than ugly
       ;; (ruby +lsp +rails) ; 1.step {|i| p "Ruby is #{i.even? ? 'love' : 'life'}"}
       scheme             ; a fully conniving family of lisps
       (sh +lsp)          ; she sells {ba,z,fi}sh shells on the C xor
       web                ; the tubes
       yaml               ; JSON, but readable

       :os
       (:if IS-MAC macos) ; improve compatibility with macOS

       :app
       (rss +org)         ; emacs as an RSS reader

       :config
       (default +bindings +smartparens))
