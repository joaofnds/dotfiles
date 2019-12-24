; -*- mode: emacs-lisp; lexical-binding: t; -*-

;; Copy this file to ~/.doom.d/init.el or ~/.config/doom/init.el ('doom install'
;; will do this for you). The `doom!' block below controls what modules are
;; enabled and in what order they will be loaded. Remember to run 'doom refresh'
;; after modifying it.
;;
;; More information about these modules (and what flags they support) can be
;; found in modules/README.org.

(doom! :completion
       ivy               ; a search engine for love and life
       company           ; the ultimate code completion backend

       ;;helm              ; the *other* search engine for love and life
       ;;ido               ; the other *other* search engine...

       :ui
       doom              ; what makes DOOM look the way it does
       doom-dashboard    ; a nifty splash screen for Emacs
       hl-todo           ; highlight TODO/FIXME/NOTE/DEPRECATED/HACK/REVIEW
       hydra             ; Make bindings that stick around
       modeline          ; snazzy, Atom-inspired modeline, plus API
       neotree           ; a project drawer, like NERDTree for vim
       vc-gutter         ; vcs diff in the fringe
       workspaces        ; tab emulation, persistence & separate workspaces
       ;;ophints           ; highlight the region an operation acts on
       ;;(popup            ; tame sudden yet inevitable temporary windows
       ;; +all             ; catch all popups that start with an asterix
       ;; +defaults       ; default popup rules
       ;; pretty-code       ; replace bits of code with pretty symbols
       unicode           ; extended unicode support for various languages

       ;;deft              ; notational velocity for Emacs
       ;;doom-quit         ; DOOM quit-message prompts when you quit Emacs
       ;;fill-column       ; a `fill-column' indicator
       ;;indent-guides     ; highlighted indent columns
       ;;nav-flash         ; blink the current line after jumping
       ;;tabs              ; an tab bar for Emacs
       ;;treemacs          ; a project drawer, like neotree but cooler
       ;;vi-tilde-fringe   ; fringe tildes to mark beyond EOB
       ;;window-select     ; visually switch windows

       :editor
       (evil +everywhere) ; come to the dark side, we have cookies
       file-templates    ; auto-snippets for empty files
       multiple-cursors  ; editing in many places at once
       snippets           ; my elves. They type so I don't have to
       fold               ; (nigh) universal code folding
       parinfer          ; turn lisp into python, sort of
       ;;lispy             ; vim for lisp, for people who dont like vim

       ;;(format +onsave)  ; automated prettiness
       ;;objed             ; text object editing for the innocent
       ;;rotate-text       ; cycle region at point between text candidates
       ;;word-wrap         ; soft wrapping with language-aware indent

       :emacs
       (dired +ranger)
       vc                ; version-control and Emacs, sitting in a tree
       ;;electric          ; smarter, keyword-based electric-indent

       :term
       vterm             ; another terminals in Emacs
       ;;eshell            ; a consistent, cross-platform shell (WIP)
       ;;shell             ; a terminal REPL for Emacs
       ;;term              ; terminals in Emacs

       :tools
       docker
       editorconfig      ; let someone else argue about tabs vs spaces
       eval              ; run code, run (also, repls)
       flycheck          ; tasing you for every semicolon you forget
       flyspell          ; tasing you for misspelling mispelling
       lsp
       macos             ; MacOS-specific commands
       magit             ; a git porcelain for Emacs
       tmux              ; an API for interacting with tmux

       ;;ansible
       ;;debugger          ; FIXME stepping through code, to help you add bugs
       ;;direnv
       ;;ein               ; tame Jupyter notebooks with emacs
       ;;gist              ; interacting with github gists
       ;;(lookup           ; helps you navigate your code and documentation
       ;; +docsets)        ; ...or in Dash docsets locally
       ;;make              ; run make tasks from Emacs
       ;;pass              ; password manager for nerds
       ;;pdf               ; pdf enhancements
       ;;prodigy           ; FIXME managing external services & code builders
       ;;rgb               ; creating color strings
       ;;terraform         ; infrastructure as code
       ;;upload            ; map local to remote projects via ssh/ftp
       ;;wakatime

       :lang
       (org                    ; organize your plain life in plain text
        +dragndrop             ; drag & drop files/images into org buffers
        +pandoc)               ; export-with-pandoc support
       (cc +lsp)               ; C/C++/Obj-C madness
       (elixir +lsp)           ; erlang done right
       (go +lsp)               ; the hipster dialect
       (haskell +lsp +intero)  ; a language that's lazier than I am
       (javascript +lsp)       ; all(hope(abandon(ye(who(enter(here))))))
       (python +lsp)           ; beautiful is better than ugly
       (ruby +lsp)             ; 1.step {|i| p "Ruby is #{i.even? ? 'love' : 'life'}"}
       (rust +lsp)             ; Fe2O3.unwrap().unwrap().unwrap().unwrap()
       (sh +lsp)               ; she sells {ba,z,fi}sh shells on the C xor
       (web +lsp)              ; the tubes
       clojure                 ; java with a lisp
       common-lisp             ; if you've seen one lisp, you've seen them all
       data                    ; config/data formats
       elm                     ; care for a cup of TEA?
       emacs-lisp              ; drown in parentheses
       erlang                  ; an elegant language for a more civilized age
       latex                   ; writing papers in Emacs has never been so fun
       markdown                ; writing docs for people to ignore

       ;;agda              ; types of types of types of types...
       ;;assembly          ; assembly for fun or debugging
       ;;coq               ; proofs-as-programs
       ;;crystal           ; ruby at the speed of c
       ;;csharp            ; unity, .NET, and mono shenanigans
       ;;ess               ; emacs speaks statistics
       ;;fsharp            ; ML stands for Microsoft's Language
       ;;hy                ; readability of scheme w/ speed of python
       ;;idris             ;
       ;;(java +meghanada) ; the poster child for carpal tunnel syndrome
       ;;julia             ; a better, faster MATLAB
       ;;kotlin            ; a better, slicker Java(Script)
       ;;lean
       ;;ledger            ; an accounting system in Emacs
       ;;lua               ; one-based indices? one-based indices
       ;;nim               ; python + lisp at the speed of c
       ;;nix               ; I hereby declare "nix geht mehr!"
       ;;ocaml             ; an objective camel
       ;;perl              ; write code no one else can comprehend
       ;;php               ; perl's insecure younger brother
       ;;plantuml          ; diagrams for confusing people more
       ;;purescript        ; javascript, but functional
       ;;qt                ; the 'cutest' gui framework ever
       ;;racket            ; a DSL for DSLs
       ;;rest              ; Emacs as a REST client
       ;;scala             ; java, but good
       ;;scheme            ; a fully conniving family of lisps
       ;;solidity          ; do you need a blockchain? No.
       ;;swift             ; who asked for emoji variables?
       ;;terra             ; Earth and Moon in alignment for performance.
       ;;vala              ; GObjective-C

       :email
       ;;(mu4e +gmail)       ; WIP
       ;;notmuch             ; WIP
       ;;(wanderlust +gmail) ; WIP

       ;; Applications are complex and opinionated modules that transform Emacs
       ;; toward a specific purpose. They may have additional dependencies and
       ;; should be loaded late.
       :app
       ;;calendar
       ;;irc               ; how neckbeards socialize
       ;;(rss +org)        ; emacs as an RSS reader
       ;;twitter           ; twitter client https://twitter.com/vnought
       ;;(write            ; emacs for writers (fiction, notes, papers, etc.)
       ;; +wordnut         ; wordnet (wn) search
       ;; +langtool)       ; a proofreader (grammar/style check) for Emacs

       :config
       ;; For literate config users. This will tangle+compile a config.org
       ;; literate config in your `doom-private-dir' whenever it changes.
       ;;literate

       ;; The default module sets reasonable defaults for Emacs. It also
       ;; provides a Spacemacs-inspired keybinding scheme and a smartparens
       ;; config. Use it as a reference for your own modules.
       (default +bindings +smartparens))
