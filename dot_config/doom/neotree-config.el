;; -*- lexical-binding: t; -*-

(setq neo-theme (if (display-graphic-p) 'icons 'arrow))

(defun neotree-move-node ()
  "Move current node to another directory."
  (interactive)
  (if-let* ((current-path (neo-buffer--get-filename-current-line))
            (to-path (read-file-name (format "Move %s to:" (f-filename current-path)))))
      (if (f-directory-p to-path)
          (f-move current-path to-path)
        (rename-file current-path to-path)))
  (neo-buffer--refresh t))

(defalias 'neotree-add-node 'neotree-create-node)

(map! :map neotree-mode-map
      :n "m a" #'neotree-add-node
      :n "m m" #'neotree-move-node
      :n "m d" #'neotree-delete-node
      :n "m c" #'neotree-copy-node

      :n "A" #'neotree-stretch-toggle
      :n "I" #'neotree-hidden-file-toggle
      :n "i" #'neotree-enter-horizontal-split
      :n "s" #'neotree-enter-vertical-split

      :n "g r" #'neotree-refresh)
