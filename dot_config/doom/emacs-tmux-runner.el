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

;;; Session:
(defvar *etr:session* nil)

(defun etr:list-sessions ()
  (interactive)
  "Lists tmux sessions."
  (split-string (etr:tmux "list-sessions -F '#{session_name}'")))

(defun etr:select-session ()
  (interactive)
  "Select a tmux session."
  (let ((sessions (etr:list-sessions)))
    (if (= (length sessions) 1)
        (car sessions)
      (etr:prompt "Session:" sessions))))

(defun etr:set-session ()
  (interactive)
  "Set *session*."
  (setf *etr:session* (etr:select-session)))

;;; Window:
(defvar *etr:window* nil)

(defun etr:list-windows ()
  (interactive)
  "Lists tmux windows."
  (s-lines (etr:tmux "list-windows -F '#{window_index} #{window_name}'")))

(defun etr:select-window ()
  (interactive)
  "Select a tmux window."
  (let ((windows (etr:list-windows)))
    (first
     (split-string
      (if (= (length windows) 1)
          (first windows)
        (etr:prompt "Window:" windows))))))

(defun etr:set-window ()
  (interactive)
  "Set *window*."
  (setf *etr:window* (etr:select-window)))

;;; Pane:
(defvar *etr:pane* nil)

(defun etr:list-panes ()
  (interactive)
  "Lists tmux panes."
  (split-string (etr:tmux "list-panes -F #{pane_index}")))

(defun etr:other-panes ()
  "Lists panes not running the current emacs."
  (let* ((output (etr:tmux "list-panes -F '#{pane_pid} #{pane_index}'"))
         (lines (split-string (string-trim output)))
         this-pid (emacs-pid))
    (cl-loop for (pid pane) on lines by #'cddr
             unless (equal pid emacs-pid)
             collect pane)))

(defun etr:select-pane ()
  (interactive)
  "Select a tmux pane."
  (let ((panes (etr:other-panes)))
    (if (= (length panes) 1)
        (car panes)
      (etr:display-panes)
      (etr:prompt "Pane:" panes))))

(defun etr:set-pane ()
  (interactive)
  "Set *pane*."
  (setf *etr:pane* (etr:select-pane)))

(defun etr:display-panes ()
  "Displays tmux panes."
  (etr:tmux "display-panes"))

;;; Command:
(defvar *etr:user-command* nil)

(defun etr:set-user-command ()
  (setf *etr:user-command* (etr:sanitize-buffer-string (read-shell-command "command: "))))

(defun etr:forget-user-command ()
  (interactive)
  "Forgets user command."
  (setf *etr:user-command* nil))

(defun etr:assert-user-command-presence ()
  (unless *etr:user-command* (etr:set-user-command)))

(defun etr:run-user-command ()
  (interactive)
  "Runs a user defined command."
  (etr:assert-user-command-presence)
  (etr:send-command *etr:user-command*))

;;; Altogether:

(defun etr:tmux (command)
  (interactive)
  "Run a tmux shell command.
  COMMAND is concated with 'tmux '"
  (shell-command-to-string (concat "tmux " command)))

(cl-defun etr:send-keys (input &optional (target (etr:target-pane)))
  (interactive)
  (etr:tmux (format "send-keys -t %s -l %s" target input)))

(cl-defun etr:send-command (input &optional (target (etr:target-pane)))
  (interactive)
  (etr:send-keys input target)
  (etr:tmux (format "send-keys -t %s C-m" target)))

(defun etr:prompt (prompt &rest args)
  "Print PROMPT and ask for some o ARGS."
  (apply 'completing-read prompt (append args '(nil t))))

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

(defun etr:vslip ()
  (interactive)
  "Splits vertically."
  (etr:tmux "split-window"))

(defun etr:hsplit ()
  (interactive)
  "Splits vertically."
  (etr:tmux "split-window -h"))

(cl-defun etr:clear-pane (&optional (pane (etr:target-pane)))
  (interactive)
  "Clears attatched pane.
  PANE is the tmux pane to focus on"
  (etr:tmux (format "send-keys -t %s C-l" pane)))

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
  "Currently selected string on the buffer. Nil if marker is not active."
  (when mark-active
    (buffer-substring-no-properties
     (region-beginning)
     (region-end))))

(cl-defun etr:sanitize-buffer-string (str)
  "Sanitizes a string grabbed from the buffer.
   This is intented to by applied to strings that are going to be
   sended to a terminal."
  (s-trim (shell-quote-argument str)))

(cl-defun etr:send-lines ()
  "Sends current selected text (or current line if no selection) to tmux."
  (interactive)
  (etr:send-command (etr:sanitize-buffer-string (or (etr:current-selection) (etr:current-line)))))

(provide 'emacs-tmux-runner)
;;; emacs-tmux-runner.el ends here
