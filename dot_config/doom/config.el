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

(evil-define-key 'normal neotree-mode-map
  (kbd "g r") 'neotree-refresh)

(setq-hook! 'ruby-mode-hook +format-with-lsp t)

(after! elfeed
  (setq-default elfeed-search-filter "@20-months-ago +unread"))

(global-set-key (kbd "C-s") 'swiper)

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

(defun after-doom-loaded ()
  (load "org-config")

  (require 'tmux-pane)
  (require 'tree-sitter)
  (require 'tree-sitter-langs)

  (tmux-pane-mode +1)
  (evil-lion-mode +1)
  (global-tree-sitter-mode +1))

(add-hook 'doom-after-init-modules-hook #'after-doom-loaded)
