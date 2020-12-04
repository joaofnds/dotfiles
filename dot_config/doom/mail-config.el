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

(defun notmuch-search-toggle-inbox ()
  "Toggle inbox tag for message."
  (interactive)
  (evil-collection-notmuch-toggle-tag "inbox" "search" 'notmuch-search-next-thread))

(defun notmuch-search-toggle-archived ()
  "Toggle archived tag for message."
  (interactive)
  (evil-collection-notmuch-toggle-tag "archived" "search" 'notmuch-search-next-thread))

(map! :map notmuch-search-mode
      :leader
      :prefix-map ("mt" . "toggle")
      :n "i" #'notmuch-search-toggle-inbox
      :n "a" #'notmuch-search-toggle-archived
      :n "u" #'evil-collection-notmuch-search-toggle-unread
      :n "d" #'evil-collection-notmuch-search-toggle-delete)
