(defun refresh-colemak-mode ()
  (global-evil-colemak-basics-mode
   (if (f-exists? "~/.colemak") 1 -1)))

(refresh-colemak-mode)

(defun jf/apply-theme ()
  (interactive)
  (refresh-colemak-mode)
  (pcase (string-trim (shell-command-to-string "osascript -l JavaScript -e \"Application('System Events').appearancePreferences.darkMode.get()\""))
    ("true" (load-theme jf/dark-theme))
    ("false" (load-theme jf/light-theme))))

(defun git-repo? (path)
  (f-dir? (f-join path ".git")))

(defun repos-from-path (path)
  (-filter 'git-repo? (f-directories path)))

(defun remove-repos-in (path)
  (-each
      (--filter (s-starts-with? path it) projectile-known-projects)
    'projectile-remove-known-project))

(defun add-repos-in (path)
  (-each (repos-from-path path) 'projectile-add-known-project))

(defun refresh-repos-in (path)
  (remove-repos-in path)
  (add-repos-in path))

(defun jf/reload-known-projects ()
  (refresh-repos-in  "~/code/me")
  (refresh-repos-in  "~/code/me/mr")
  (projectile-add-known-project "~/notes")
  (projectile-add-known-project "~/code/dotfiles")
  (projectile-add-known-project "~/code/exercism"))

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
