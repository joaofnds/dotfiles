(defun jf/git-repo? (path)
  (f-dir? (f-join path ".git")))

(defun jf/repos-from-path (path)
  (-filter 'git-repo? (f-directories path)))

(defun jf/remove-repos-in (path)
  (-each
      (--filter (s-starts-with? path it) projectile-known-projects)
    'projectile-remove-known-project))

(defun jf/add-repos-in (path)
  (-each (repos-from-path path) 'projectile-add-known-project))

(defun jf/refresh-repos-in (path)
  (remove-repos-in path)
  (add-repos-in path))

(defun jf/reload-known-projects ()
  (projectile-add-known-project "~/notes")
  (projectile-add-known-project "~/code/dotfiles")
  (projectile-add-known-project "~/code/exercism"))

(defun jf/restore-frame-size ()
  (set-frame-size
   (selected-frame)
   (alist-get 'width initial-frame-alist)
   (alist-get 'height initial-frame-alist)))

(defun jf/notes/open-home ()
  (interactive)
  (let ((drop-in-line 25))
    (find-file "~/notes/home.org")
    (spell-fu-mode -1)
    (evil-goto-line drop-in-line)
    (evil-scroll-line-to-bottom drop-in-line)
    (org-set-startup-visibility)))

(defun jf/hex-decode-region (start end)
  (interactive "r")
  (let ((text (buffer-substring start end)))
    (delete-region start end)
    (insert (number-to-string (string-to-number text 16)))))

(defun jf/hex-encode-region (start end)
  (interactive "r")
  (let ((text (buffer-substring start end)))
    (delete-region start end)
    (insert (format "%x" (string-to-number text)))))

(defun jf/timestamp-decode-region (start end)
  (interactive "r")
  (->> (buffer-substring start end)
       (s-left 10)
       (string-to-number)
       (format-time-string "%Y-%m-%dT%T%z")
       (insert))
  (delete-region start end))

(defun jf/timestamp-encode-region (start end)
  (interactive "r")
  (->> (buffer-substring start end)
       (parse-time-string)
       (encode-time)
       (format-time-string "%s")
       (insert))
  (delete-region start end))
