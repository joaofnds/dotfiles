;;; ~/.doom.d/config.el -*- lexical-binding: t; -*-

(require 'tmux-pane)

(setq
 doom-font (font-spec :family "Dank Mono" :size 18)
 doom-big-font (font-spec :family "Dank Mono" :size 24)
 tab-width 2
 indent-tabs-mode nil
 make-backup-files nil
 projectile-project-search-path '("~/code/")
 tmux-pane-mode t
 dired-dwim-target t
 org-bullets-bullet-list '("⁖")
 org-tags-column -80)

(after! org
  (map! :map org-mode-map
        :n "M-j" #'org-metadown
        :n "M-k" #'org-metaup))

(after! ruby
  (add-to-list 'hs-special-modes-alist
               `(ruby-mode
                 ,(rx (or "def" "class" "module" "do" "{" "[")) ; Block start
                 ,(rx (or "}" "]" "end"))                       ; Block end
                 ,(rx (or "#" "=begin"))                        ; Comment start
                 ruby-forward-sexp nil)))
