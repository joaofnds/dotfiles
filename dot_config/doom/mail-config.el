(setq message-send-mail-function   'smtpmail-send-it
      starttls-use-gnutls          t
      smtpmail-smtp-user           "joaovitorfernandes2@gmail.com"
      smtpmail-default-smtp-server "smtp.gmail.com"
      smtpmail-smtp-server         "smtp.gmail.com"
      smtpmail-stream-type         'starttls)

(after! notmuch
  (setq +notmuch-sync-backend 'mbsync
        +notmuch-mail-folder "~/Mail"
        notmuch-saved-searches
        '((:name "inbox" :query "tag:inbox" :key "i")
          (:name "archive" :query "tag:archived" :key "a")
          (:name "unread" :query "tag:unread" :key "u")
          (:name "sent" :query "tag:sent" :key "t")
          (:name "drafts" :query "tag:draft" :key "d")
          (:name "all mail" :query "*" :key "*"))))

(defmacro def-tag-toggle (tag-name)
  `(defun ,(make-symbol (concat "notmuch-search-toggle-" tag-name)) ()
     ,(concat "Toggle " tag-name " tag for message.")
     (interactive)
     (evil-collection-notmuch-toggle-tag tag-name "search" 'notmuch-search-next-thread)))

(def-tag-toggle "inbox")
(def-tag-toggle "archived")

(map! :map notmuch-search-mode
      :leader
      :prefix-map ("mt" . "toggle")
      :n "i" #'notmuch-search-toggle-inbox
      :n "a" #'notmuch-search-toggle-archived
      :n "u" #'evil-collection-notmuch-search-toggle-unread
      :n "d" #'evil-collection-notmuch-search-toggle-delete)
