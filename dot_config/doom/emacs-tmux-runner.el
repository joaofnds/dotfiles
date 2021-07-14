;;; emacs-tmux-runner.el --- Description -*- lexical-binding: t; -*-
;;
;; Copyright (C) 2021 João Fernandes
;;
;; Author: João Fernandes <https://github.com/joaofnds>
;; Maintainer: João Fernandes <joaofnds@joaofnds.com>
;; Created: July 12, 2021
;; Modified: July 12, 2021
;; Version: 0.0.1
;; Keywords: Symbol’s value as variable is void: finder-known-keywords
;; Homepage: https://github.com/joaofnds/emacs-tmux-runner
;; Package-Requires: ((emacs "24.3"))
;;
;; This file is not part of GNU Emacs.
;;
;;; Commentary:
;;
;;  Description
;;
;;; Code:

(defvar *etr:session* nil)
(defvar *etr:window* nil)
(defvar *etr:pane* nil)

(defun etr:tmux (command)
  (interactive)
  "Run a tmux shell command.
  COMMAND is concated with 'tmux '"
  (shell-command-to-string (concat "tmux " command)))

(cl-defun etr:send-keys (input &optional (target (etr:target-pane)))
  (interactive)
  (etr:tmux (format "send-keys -t %s %s" target input)))

(cl-defun etr:send-command (input &optional (target (etr:target-pane)))
  (interactive)
  (etr:tmux (format "send-keys -t %s %s C-m" target input)))

(defun etr:list-sessions ()
  (interactive)
  "Lists tmux sessions."
  (split-string (etr:tmux "list-sessions -F '#{session_name}'")))

(defun etr:list-windows ()
  (interactive)
  "Lists tmux windows."
  (split-string (etr:tmux "list-windows -F '#{window_name}'")))

(defun etr:list-panes ()
  (interactive)
  "Lists tmux panes."
  (split-string (etr:tmux "list-panes -F #{pane_index}")))

(defun etr:other-panes ()
  (interactive)
  "Lists panes without focus."
  (let* ((output (etr:tmux "list-panes -F '#{pane_active} #{pane_index}'"))
         (lines (split-string (string-trim output))))
    (cl-loop for (active pane) on lines by #'cddr
             when (equal active "0")
             collect pane)))

(defun etr:prompt (prompt &rest args)
  "Print PROMPT and ask for some o ARGS."
  (apply 'completing-read prompt (append args '(nil t))))

(defun etr:select-session ()
  (interactive)
  "Select a tmux session."
  (let ((sessions (etr:list-sessions)))
    (if (= (length sessions) 1)
        (car sessions)
      (etr:prompt "Session:" sessions))))

(defun etr:select-window ()
  (interactive)
  "Select a tmux window."
  (let ((windows (etr:list-windows)))
    (if (= (length windows) 1)
        (car windows)
      (etr:prompt "Window:" windows))))

(defun etr:select-pane ()
  (interactive)
  "Select a tmux pane."
  (let ((panes (etr:other-panes)))
    (if (= (length panes) 1)
        (car panes)
      (etr:display-panes)
      (etr:prompt "Pane:" panes))))

(defun etr:set-session ()
  (interactive)
  "Set *session*."
  (setf *etr:session* (etr:select-session)))

(defun etr:set-window ()
  (interactive)
  "Set *window*."
  (setf *etr:window* (etr:select-window)))

(defun etr:set-pane ()
  (interactive)
  "Set *pane*."
  (setf *etr:pane* (etr:select-pane)))

(cl-defun etr:target-pane ()
  (etr:ensure-target-pane)
  (format "%s:%s.%s" *etr:session* *etr:window* *etr:pane*))

(defun etr:reset-target-pane ()
  (interactive)
  "Prompt for session, window and pane."
  (etr:set-session)
  (etr:set-window)
  (etr:set-pane))

(defun etr:ensure-target-pane ()
  "Check if session, window and pane are set and set it if not."
  (unless (and *etr:session* *etr:window* *etr:pane*)
    (etr:reset-target-pane)))

(defun etr:display-panes ()
  "Displays tmux panes."
  (etr:tmux "display-panes"))

(defun etr:vslip ()
  (interactive)
  "Splits vertically."
  (etr:tmux "split-window"))

(defun etr:hsplit ()
  (interactive)
  "Splits vertically."
  (etr:tmux "split-window -h"))

(cl-defun etr:focus-pane (&optional (pane (etr:target-pane)))
  (interactive)
  "Focuses on a tmux pane.
  PANE is the tmux pane to focus on"
  (etr:tmux (concat "select-pane -t " pane)))

(cl-defun etr:zoom-pane (&optional (pane (etr:target-pane)))
  (interactive)
  "Zooms on a tmux pane.
  PANE is the tmux pane to zoom on"
  (etr:focus-pane pane)
  (etr:tmux "resize-pane -Z"))

(cl-defun etr:current-line ()
  (buffer-substring-no-properties
   (line-beginning-position)
   (line-end-position)))


(cl-defun etr:current-selection ()
  (when mark-active
    (buffer-substring-no-properties
     (region-beginning)
     (region-end))))

(cl-defun etr:sanitize-buffer-string (str)
  (s-trim (shell-quote-argument str)))

(cl-defun etr:send-lines ()
  (interactive)
  (etr:send-command (etr:sanitize-buffer-string (or (etr:current-selection) (etr:current-line)))))

(provide 'emacs-tmux-runner)
;;; emacs-tmux-runner.el ends here
