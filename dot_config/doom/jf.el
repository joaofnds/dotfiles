(defun jf/apply-theme ()
  (interactive)
  (pcase (string-trim (shell-command-to-string "osascript -l JavaScript -e \"Application('System Events').appearancePreferences.darkMode.get()\""))
    ("true" (load-theme jf/dark-theme))
    ("false" (load-theme jf/light-theme))))

(defun some-prefix (str &rest prefixes)
  (--some (s-starts-with? it str) prefixes))

(defun remove-known-projects-starting-with (&rest prefixes)
  (setf projectile-known-projects
        (--remove
         (apply 'some-prefix it prefixes)
         projectile-known-projects)))

(defun git-repo? (path)
  (f-dir? (f-join path ".git")))

(defun repos-from-path (path)
  (-filter 'git-repo? (f-directories path)))

(defun jf/reload-known-projects ()
  (let ((me-path "~/code/me")
        (mr-path "~/code/me/mr"))

    (remove-known-projects-starting-with me-path)

    (-each
        (-concat
         '("~/notes" "~/code/dotfiles" "~/code/exercism")
         (repos-from-path me-path)
         (repos-from-path mr-path))
      'projectile-add-known-project)))

(defun jf/restore-frame-size ()
  (set-frame-size
   (selected-frame)
   (alist-get 'width initial-frame-alist)
   (alist-get 'height initial-frame-alist)))

(defun jf/download-exercism-exercise ()
  (interactive)
  (let* ((track-dir (read-directory-name "track: " "~/code/exercism"))
         (track (f-filename track-dir))
         (exercise (read-string "exercise: "))
         (command (s-concat "exercism download --exercise=" exercise " --track=" track))
         (should-run (y-or-n-p (s-concat "Should run '" command "'?"))))
    (when should-run (shell-command command))))
