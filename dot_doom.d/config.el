;;; ~/.doom.d/config.el -*- lexical-binding: t; -*-

(require 'tmux-pane)

(setq
 doom-theme 'doom-solarized-dark
 doom-font (font-spec :family "Dank Mono" :size 18)
 doom-big-font (font-spec :family "Dank Mono" :size 24)

 display-line-numbers t
 display-line-numbers-type 'relative
 display-line-numbers-current-absolute t

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
        :n "M-k" #'org-metaup)
  (setq
   org-todo-keywords '((sequence "TODO(t)" "PROJ(p!)" "|" "DONE(d!)")
                       (sequence "[ ](T)"  "[-](P)"  "[?](M@)" "|" "[X](D!)")
                       (sequence "NEXT(n)" "WAIT(w@/!)" "HOLD(h@/!)" "|" "ABRT(c@)"))
   org-enforce-todo-dependencies t
   org-enforce-todo-checkbox-dependencies t
   org-log-done 'time
   org-log-into-drawer t))

(after! ruby
  (add-to-list 'hs-special-modes-alist
               `(ruby-mode
                 ,(rx (or "def" "class" "module" "do" "{" "[")) ; Block start
                 ,(rx (or "}" "]" "end"))                       ; Block end
                 ,(rx (or "#" "=begin"))                        ; Comment start
                 ruby-forward-sexp nil)))
