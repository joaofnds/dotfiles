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
       modeline          ; snazzy, Atom-inspired modeline, plus API
       workspaces        ; tab emulation, persistence & separate workspaces
       hl-todo           ; highlight TODO/FIXME/NOTE/DEPRECATED/HACK/REVIEW
       hydra             ; Make bindings that stick around
       ;; neotree           ; a project drawer, like NERDTree for vim
       ;; unicode           ; extended unicode support for various languages

       ;;deft              ; notational velocity for Emacs
       ;;doom-quit         ; DOOM quit-message prompts when you quit Emacs
       ;;fill-column       ; a `fill-column' indicator
       ;;indent-guides     ; highlighted indent columns
       ;;nav-flash         ; blink the current line after jumping
       ;;ophints           ; highlight the region an operation acts on
       ;;(popup            ; tame sudden yet inevitable temporary windows
       ;; +all             ; catch all popups that start with an asterix
       ;; +defaults)       ; default popup rules
       ;;pretty-code       ; replace bits of code with pretty symbols
       ;;tabs              ; an tab bar for Emacs
       ;;treemacs          ; a project drawer, like neotree but cooler
       ;;vc-gutter         ; vcs diff in the fringe
       ;;vi-tilde-fringe   ; fringe tildes to mark beyond EOB
       ;;window-select     ; visually switch windows

       :editor
       (evil +everywhere) ; come to the dark side, we have cookies
       file-templates    ; auto-snippets for empty files
       multiple-cursors  ; editing in many places at once
       snippets           ; my elves. They type so I don't have to
       ;;fold               ; (nigh) universal code folding
       ;;parinfer          ; turn lisp into python, sort of
       ;;lispy             ; vim for lisp, for people who dont like vim

       ;;(format +onsave)  ; automated prettiness
       ;;objed             ; text object editing for the innocent
       ;;rotate-text       ; cycle region at point between text candidates
       ;;word-wrap         ; soft wrapping with language-aware indent

       :emacs
       (dired            ; making dired pretty [functional]
        +ranger)         ; bringing the goodness of ranger to dired

       ;;electric          ; smarter, keyword-based electric-indent
       ;;vc                ; version-control and Emacs, sitting in a tree

       :term
       ;;eshell            ; a consistent, cross-platform shell (WIP)
       ;;shell             ; a terminal REPL for Emacs
       ;;term              ; terminals in Emacs
       ;;vterm             ; another terminals in Emacs

       :tools
       magit             ; a git porcelain for Emacs
       flycheck          ; tasing you for every semicolon you forget
       lsp
       eval              ; run code, run (also, repls)
       editorconfig      ; let someone else argue about tabs vs spaces
       docker

       ;;ansible
       ;;debugger          ; FIXME stepping through code, to help you add bugs
       ;;direnv
       ;;ein               ; tame Jupyter notebooks with emacs
       ;;flyspell          ; tasing you for misspelling mispelling
       ;;gist              ; interacting with github gists
       ;;(lookup           ; helps you navigate your code and documentation
       ;; +docsets)        ; ...or in Dash docsets locally
       ;;macos             ; MacOS-specific commands
       ;;make              ; run make tasks from Emacs
       ;;pass              ; password manager for nerds
       ;;pdf               ; pdf enhancements
       ;;prodigy           ; FIXME managing external services & code builders
       ;;rgb               ; creating color strings
       ;;terraform         ; infrastructure as code
       ;;tmux              ; an API for interacting with tmux
       ;;upload            ; map local to remote projects via ssh/ftp
       ;;wakatime

       :lang
       (org              ; organize your plain life in plain text
        +dragndrop       ; drag & drop files/images into org buffers
        +pandoc)         ; export-with-pandoc support
       common-lisp       ; if you've seen one lisp, you've seen them all
       data              ; config/data formats
       emacs-lisp        ; drown in parentheses
       go                ; the hipster dialect
       javascript        ; all(hope(abandon(ye(who(enter(here))))))
       ruby              ; 1.step {|i| p "Ruby is #{i.even? ? 'love' : 'life'}"}
       sh                ; she sells {ba,z,fi}sh shells on the C xor
       ;;cc                ; C/C++/Obj-C madness
       ;;clojure           ; java with a lisp
       ;;elixir            ; erlang done right
       ;;elm               ; care for a cup of TEA?
       ;;erlang            ; an elegant language for a more civilized age
       ;;(haskell +intero) ; a language that's lazier than I am
       ;;latex             ; writing papers in Emacs has never been so fun
       ;;markdown          ; writing docs for people to ignore
       ;;python            ; beautiful is better than ugly
       ;;rust              ; Fe2O3.unwrap().unwrap().unwrap().unwrap()

       ;;agda              ; types of types of types of types...
       ;;assembly          ; assembly for fun or debugging
       ;;coq               ; proofs-as-programs
       ;;crystal           ; ruby at the speed of c
       ;;csharp            ; unity, .NET, and mono shenanigans
       ;;ess               ; emacs speaks statistics
       ;;fsharp           ; ML stands for Microsoft's Language
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
       ;;web               ; the tubes

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
