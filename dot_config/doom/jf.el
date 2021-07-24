(defun jf/apply-theme ()
  (interactive)
  (pcase (string-trim (shell-command-to-string "osascript -l JavaScript -e \"Application('System Events').appearancePreferences.darkMode.get()\""))
    ("true" (load-theme jf/dark-theme))
    ("false" (load-theme jf/light-theme))))

(defun jf/reload-known-projects ()
  (-each
      (-concat
       '("~/notes" "~/code/dotfiles" "~/code/exercism")
       (f-directories "~/code/melhor-envio"))
    'projectile-add-known-project))

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
