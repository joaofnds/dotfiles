;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library
(package! f)                 ; modern api for working with files and directories

(package! restclient)        ; HTTP REST client tool for emacs

(package! vmd-mode)

(package! org-mac-link)      ; insert org-mode links to items selected in various mac apps
(package! org-appear)        ; automatic visibility of various org elements depending on cursor position
(package! org-roam-ui)       ; graphical frontend for exploring org-roam Zettelkasten
(package! wakatime-mode)     ; track time spent in emacs

(package! string-inflection) ; underscore_case -> UPCASE -> camelCase -> PascalCase conversion of names
(package! package-lint)      ; a linting library for elisp package authors
(package! tmux-pane         ; negivate seamlessly between tmux and emacs
  :recipe (:host github
           :repo "joaofnds/emacs-tmux-pane"
           :files ("tmux-pane.el")))

(package! emacs-tmux-runner  ; my port of christoomey/vim-tmux-runner
  :recipe (:host github
           :repo "joaofnds/emacs-tmux-runner"
           :files ("emacs-tmux-runner.el")
           :build (:not compile)))

(package! copilot
  :recipe (:host github :repo "zerolfx/copilot.el" :files ("*.el" "dist")))

(package! nyan-mode)
