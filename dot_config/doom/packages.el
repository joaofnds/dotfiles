;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library
(package! f)                 ; modern api for working with files and directories

(package! dirvish)

(package! flymake-grammarly) ; flymake support for grammarly

(package! tree-sitter)       ; parser generator tool and an incremental parsing library
(package! tree-sitter-langs) ; populates global registries of grammars and queries

(package! org-menu          ; transient menu for org
  :recipe (:host github :repo "sheijk/org-menu" :files ("*.el")))
(package! org-roam)          ; rudimentary roam replica with org-mode
(package! websocket)         ; org-roam-ui dependency
(package! org-roam-ui)       ; a graphical frontend for exploring org-roam
(package! org-mac-link       ; insert org-mode links to items selected in various mac apps
  :recipe (:host github :repo "emacsmirror/org-mac-link" :files ("*.el")))

(package! string-inflection) ; underscore_case -> UPCASE -> camelCase -> PascalCase conversion of names
(package! package-lint)      ; a linting library for elisp package authors
(package! spongebob-case     ; YoU cAn’T wRiTe A pAcKaGe ThIs StUpId!
  :recipe (:host github :repo "duckwork/spongebob-case.el" :files ("*.el")))

(package! tmux-pane)         ; negivate seamlessly between tmux and emacs
(package! emacs-tmux-runner ; my port of christoomey/vim-tmux-runner
  :recipe (:host github :repo "joaofnds/emacs-tmux-runner"))

(package! evil-colemak-basics)

(package! org-appear         ; a graphical frontend for exploring org-roam
  :recipe (:host github :repo "awth13/org-appear" :files ("*.el")))

(unpin! format-all)
