;; -*- mode: emacs-lisp; lexical-binding: t; -*-

(add-to-list 'load-path "~/.config/doom")

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

      projectile-project-search-path '("~/code/")
      projectile-enable-caching nil

      +ivy-project-search-engines '(ag)

      dired-dwim-target t)

(global-set-key (kbd "C-s") 'swiper)

(defalias 'forward-evil-word 'forward-evil-symbol)

(add-hook! '(go-mode-hook js2-mode-hook enh-ruby-mode-hook)
           #'(hs-minor-mode lsp-deferred yas-minor-mode))

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
