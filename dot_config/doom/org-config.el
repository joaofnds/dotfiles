(add-hook 'org-mode-hook #'yas-minor-mode)

(after! org
  (map! :map org-mode-map
        :n "M-j" #'org-metadown
        :n "M-k" #'org-metaup)

  (add-to-list 'org-modules 'org-habit)

  (setq org-directory "~/notes"

        org-todo-keywords '((sequence "TODO(t)" "DOING(d!)" "DONE(f!)")
                            (sequence "[ ](T)" "[-](D!)" "[X](F!)")
                            (type "BLOCKED(b@)" "[?](B@)" "CANCELLED(c@!)"))

        ;; Hide emphasis marker characters (~foo~ -> foo, =foo= -> foo)
        org-hide-emphasis-markers t
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
                           "~/notes/habits.org"
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
