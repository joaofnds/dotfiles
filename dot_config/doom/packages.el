;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library
(package! f)                 ; modern api for working with files and directories

(package! flymake-grammarly) ; flymake support for grammarly

(package! tree-sitter)       ; parser generator tool and an incremental parsing library
(package! tree-sitter-langs) ; populates global registries of grammars and queries

(package! org-roam)          ; rudimentary roam replica with org-mode
(package! websocket)         ; org-roam-ui dependency
(package! org-roam-ui        ; a graphical frontend for exploring org-roam
  :recipe (:host github :repo "org-roam/org-roam-ui" :files ("*.el" "out")))

(package! string-inflection) ; underscore_case -> UPCASE -> camelCase -> PascalCase conversion of names
(package! package-lint)      ; a linting library for elisp package authors

(package! tmux-pane)         ; negivate seamlessly between tmux and emacs
(package! emacs-tmux-runner ; my port of christoomey/vim-tmux-runner
  :recipe (:host github :repo "joaofnds/emacs-tmux-runner"))

(unpin! format-all)
