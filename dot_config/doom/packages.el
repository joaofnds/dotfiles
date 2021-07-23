;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library.
(package! f)                 ; modern api for working with files and directories
(package! tmux-pane)         ; negivate seamlessly between tmux and emacs
(package! org-roam)          ; rudimentary roam replica with org-mode
(package! emacs-tmux-runner  ; my port of christoomey/vim-tmux-runner
  :recipe (:host github :repo "joaofnds/emacs-tmux-runner"))

(disable-packages!
 amx
 anzu
 avy
 counsel-projectile
 drag-stuff
 evil-anzu
 github-review
 htmlize
 ivy-avy
 ivy-rich
 link-hint
 magit-gitflow
 magit-todos
 ob-async
 ob-sync
 org-cliplink
 org-yt
 orgit
 ox-clip
 solaire-mode
 toc-org
 wgrep)
