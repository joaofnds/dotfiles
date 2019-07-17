;;; ~/.doom.d/config.el -*- lexical-binding: t; -*-

(setq
  doom-font (font-spec :family "Dank Mono" :size 24)
  doom-big-font (font-spec :family "Dank Mono" :size 30)
  tab-width 2
  indent-tabs-mode nil
  make-backup-files nil)

(after! org
  (map! :map org-mode-map
        :n "M-j" #'org-metadown
        :n "M-k" #'org-metaup))

(centaur-tabs-mode t)
