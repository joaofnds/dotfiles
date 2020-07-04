; -*- mode: emacs-lisp; no-byte-compile: t; -*-

(package! magit-delta)  ; Use Delta when displaying diffs in Magit

(package! tmux-pane)    ; Negivate seamlessly between tmux and emacs
(package! evil-lion)    ; Evil align operator, port of vim-lion
(package! evil-numbers) ; Increment and decrement numbers in Emacs

;; (package! org-web-tools)    ; View, capture, and archive Web pages in Org-mode

;; Ruby packages
(package! inflections)      ; Needed by projectile-rails
(package! projectile-rails) ; Minor mode for Rails projects based on projectile-mode
(package! rspec-mode)
(package! emamux)
(package! emamux-ruby-test)

;; (package! rjsx-mode)        ; Real support for JSX
;; (package! macos :ignore (not (equal system-type 'darwin)))
;; (package! eyebrowse)
