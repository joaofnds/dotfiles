(when IS-MAC
  (define-key special-event-map [sigusr1] 'jf/apply-theme))

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
