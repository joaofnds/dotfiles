;; -*- mode: emacs-lisp; lexical-binding: t; -*-

(require 'tmux-pane)
(require 'tree-sitter)
(require 'tree-sitter-langs)

(setq user-full-name "João Fernandes"
      user-mail-address "joaofnds@joaofnds.com"

      make-backup-files nil

      initial-frame-alist '((width . 120)
                            (height . 50)
                            (ns-transparent-titlebar t))

      frame-title-format '("%b")

      tab-width 2
      indent-tabs-mode nil
      +format-with-lsp nil

      visual-fill-column-width 120
      visual-fill-column-center-text t

      display-line-numbers t
      display-line-numbers-type 'relative
      display-line-numbers-current-absolute t

      doom-theme 'doom-solarized-dark
      doom-themes-enable-bold t
      doom-themes-enable-italic t
      doom-font (font-spec :family "Iosevka SS08" :weight 'normal :size 18)
      doom-variable-pitch-font (font-spec :family "Iosevka Aile")
      doom-big-font-increment 6

      ;; org
      org-directory "~/notes/"

      projectile-project-search-path '("~/code/")
      projectile-enable-caching nil

      +ivy-project-search-engines '(ag)

      dired-dwim-target t)

(global-set-key (kbd "C-s") 'swiper)

(defalias 'forward-evil-word 'forward-evil-symbol)

(after! org
  (map! :map org-mode-map
        :n "M-j" #'org-metadown
        :n "M-k" #'org-metaup)
  (setq org-todo-keywords '((sequence "TODO(t)" "DOING(d!)" "DONE(f!)")
                            (sequence "[ ](T)" "[-](D!)" "[X](F!)")
                            (type "BLOCKED(b@)" "[?](B@)" "CANCELLED(c@!)"))
        ;; The column to which tags should be indented in a headline
        org-tags-column -80
        ;; Non-nil means undone TODO entries will block switching the parent to DONE
        org-enforce-todo-dependencies t
        ;; Non-nil means unchecked boxes will block switching the parent to DONE
        org-enforce-todo-checkbox-dependencies t
        ;; Information to record when a task moves to the DONE state.
        org-log-done 'time
        ;; Non-nil means insert state change notes and time stamps into a drawer
        org-log-into-drawer t

        org-agenda-files '("~/notes/home.org"
                           "~/notes/skore/skore.org"
                           "~/notes/ufpel/computer-lab/computer-lab.org"
                           "~/notes/ufpel/computer-theory/computer-theory.org"
                           "~/notes/theo.org")

        variable-pich-font-family "Iosevka Aile"
        cursive-font-family "CMU Classical Serif")


  (set-face-attribute 'variable-pitch nil :font "Iosevka Aile")

  (set-face-attribute 'org-document-title nil :font variable-pich-font-family :height 1.5)
  (set-face-attribute 'org-document-info nil :font variable-pich-font-family :height 1.2)
  (set-face-attribute 'org-document-info-keyword nil :height 0.9 :inherit 'shadow)
  (set-face-attribute 'org-meta-line nil :height 0.9 :inherit 'shadow)
  (set-face-attribute 'org-quote nil :font cursive-font-family :height 1.2 :inherit 'org-quote)
  (set-face-attribute 'org-todo nil :weight 'ultrabold)
  (set-face-attribute 'org-tag nil :font variable-pich-font-family)
  (set-face-attribute 'org-level-1 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-1)
  (set-face-attribute 'org-level-2 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-2)
  (set-face-attribute 'org-level-3 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-3)
  (set-face-attribute 'org-level-4 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-4)
  (set-face-attribute 'org-level-5 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-5)
  (set-face-attribute 'org-level-6 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-6)
  (set-face-attribute 'org-level-7 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-7)
  (set-face-attribute 'org-level-8 nil :font variable-pich-font-family :height 1.0 :inherit 'outline-8))

(add-hook! '(go-mode-hook js2-mode-hook enh-ruby-mode-hook)
           #'(hs-minor-mode lsp-deferred yas-minor-mode))

(add-hook 'org-mode-hook #'yas-minor-mode)
(add-hook 'emacs-lisp-mode-hook #'hs-minor-mode)
(add-hook 'typescript-mode-hook #'prettier-js-mode)
(add-hook 'tree-sitter-after-on-hook #'tree-sitter-hl-mode)

(add-to-list 'hs-special-modes-alist
             '(ruby-mode "\\(def\\|do\\|class\\|begin\\|ensure\\|if\\|unless\\|{\\)"
                         "\\(end\\|end\\|end\\|end\\|end\\|end\\|end\\|}\\)"
                         "#"
                         (lambda (arg) (ruby-end-of-block))
                         nil))

(map! :leader
      :n "l d" #'lsp-find-definition
      :n "l R" #'lsp-find-references
      :n "l r" #'lsp-rename
      :n "l f" #'lsp-format-region
      :n "l F" #'lsp-format-buffer)

(load "~/.config/doom/mail-config.el")

(tmux-pane-mode t)
(evil-lion-mode t)
(global-tree-sitter-mode)
