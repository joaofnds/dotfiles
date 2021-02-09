;; -*- lexical-binding: t; -*-

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

      font-size (cond
                  (IS-LINUX 16)
                  (t 18))

      doom-theme 'doom-solarized-dark
      doom-themes-enable-bold t
      doom-themes-enable-italic t
      doom-font (font-spec :family "Iosevka SS08" :size font-size)
      doom-variable-pitch-font (font-spec :family "Iosevka Aile")
      doom-big-font-increment 6

      projectile-project-search-path '("~/code/")
      projectile-enable-caching nil

      +ivy-project-search-engines '(ag)

      dired-dwim-target t)

(setq-hook! 'ruby-mode-hook +format-with-lsp t)

(after! elfeed
  (setq-default elfeed-search-filter "+unread")
  (map! :map elfeed-search-mode-map
        :n "g r" #'elfeed-update))

(map!
 "C-s" #'swiper
 :leader
 "o e" #'elfeed)


(defalias 'forward-evil-word 'forward-evil-symbol)

(add-hook 'typescript-mode-hook #'prettier-js-mode)
(add-hook 'tree-sitter-after-on-hook #'tree-sitter-hl-mode)

(defun jf/reload-known-projects ()
  (-each
      (-concat
       '("~/notes" "~/code/dotfiles" "~/code/exercism")
       (f-directories "~/code/skore"))
    'projectile-add-known-project))

(setq default-cider-options "-M:lib/cider-nrepl"
      cider-options-with-rebl "-M:lib/cider-nrepl:inspect/rebl:middleware/nrebl")

(defun clj/toggle-cider-rebl ()
  (if (string= cider-clojure-cli-global-options default-cider-options)
      (setq cider-clojure-cli-global-options cider-options-with-rebl)
    (setq cider-clojure-cli-global-options default-cider-options)))

(after! neotree
  (load! "neotree-config"))

(after! org
  (load! "org-config"))

(defun after-doom-loaded ()
  (tmux-pane-mode t)
  (global-tree-sitter-mode t)
  (evil-lion-mode t))

(add-hook 'emacs-startup-hook #'after-doom-loaded)
