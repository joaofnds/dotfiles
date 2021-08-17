;; -*- lexical-binding: t; -*-

(add-hook 'org-mode-hook #'yas-minor-mode)

(map! :map org-mode-map
      :n "M-j" #'org-metadown
      :n "M-k" #'org-metaup

      :map evil-org-agenda-mode-map
      :m "q" #'org-agenda-exit)

(add-to-list 'org-modules 'org-habit)
(add-to-list 'org-modules 'org-mouse)

(setq org-directory "~/notes/"

      org-todo-keywords '((sequence "TODO(t)" "DOING(p!)" "DONE(d!)")
                          (sequence "[ ](T)" "[-](P!)" "[X](D!)")
                          (type "BLOCKED(b@)" "[?](B@)" "CANCELLED(c@!)"))

      org-hide-emphasis-markers t
      org-tags-column -80
      org-enforce-todo-dependencies t
      org-enforce-todo-checkbox-dependencies t
      org-log-done 'time
      org-log-into-drawer t
      org-format-latex-options (plist-put org-format-latex-options :scale 2.5)

      org-agenda-files '("~/notes/home.org"
                         "~/notes/habits.org"
                         "~/notes/ufpel/ufpel.org"
                         "~/notes/melhor-envio/melhor-envio.org"
                         "~/notes/melhor-envio/melhor-rastreio.org"))

(set-face-attribute 'org-block-begin-line nil :font jf/font/fixed-family :height 0.8 :background nil :inherit 'shadow)
(set-face-attribute 'org-block-end-line nil :font jf/font/fixed-family :height 0.8 :background nil :inherit 'shadow)
(set-face-attribute 'org-code nil :font jf/font/fixed-family :height 1.0)
(set-face-attribute 'org-document-info nil :font jf/font/variable-family :height 1.2)
(set-face-attribute 'org-document-info-keyword nil :height 0.9 :inherit 'shadow)
(set-face-attribute 'org-document-title nil :font jf/font/variable-family :height 1.5)
(set-face-attribute 'org-level-1 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-1)
(set-face-attribute 'org-level-2 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-2)
(set-face-attribute 'org-level-3 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-3)
(set-face-attribute 'org-level-4 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-4)
(set-face-attribute 'org-level-5 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-5)
(set-face-attribute 'org-level-6 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-6)
(set-face-attribute 'org-level-7 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-7)
(set-face-attribute 'org-level-8 nil :font jf/font/variable-family :height 1.0 :inherit 'outline-8)
(set-face-attribute 'org-meta-line nil :height 0.9 :foreground nil :inherit 'shadow)
(set-face-attribute 'org-quote nil :font jf/font/cursive-family :height 1.2 :inherit 'default)
(set-face-attribute 'org-tag nil :font jf/font/variable-family :height 1.0)
(set-face-attribute 'org-todo nil :weight 'semibold :height 1.0)
(set-face-attribute 'org-verbatim nil :font "CMU Typewriter Text" :height 1.1)
(set-face-attribute 'variable-pitch nil :font jf/font/variable-family :height 1.0)

(defun jf/toggle-org-markers ()
  (setf org-hide-emphasis-markers (not org-hide-emphasis-markers)))
