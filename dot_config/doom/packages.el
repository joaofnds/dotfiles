;; -*- lexical-binding: t; -*-

(package! flymake-grammarly)
(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library.
(package! f)                 ; modern api for working with files and directories
(package! tmux-pane)         ; negivate seamlessly between tmux and emacs
(package! tree-sitter)       ; parser generator tool and an incremental parsing library
(package! tree-sitter-langs) ; populates global registries of grammars and queries
(package! string-inflection) ; underscore_case -> UPCASE -> camelCase -> PascalCase conversion of names
(package! org-roam)          ; rudimentary roam replica with org-mode
(package! package-lint)      ; a linting library for elisp package authors
(package! emacs-tmux-runner ; my port of christoomey/vim-tmux-runner
  :recipe (:host github :repo "joaofnds/emacs-tmux-runner"))

(package! websocket)         ; org-roam-ui dependency
(package! org-roam-ui
  :recipe (:host github :repo "org-roam/org-roam-ui" :files ("*.el" "out")))

(unpin! format-all)
