
(after! notmuch
  (setq message-send-mail-function   'smtpmail-send-it
        send-mail-function           'smtpmail-send-it
        smtpmail-default-smtp-server "smtp.gmail.com"
        smtpmail-smtp-server         "smtp.gmail.com"
        smtpmail-smtp-user           "joaovitorfernandes2@gmail.com"
        smtpmail-stream-type         'starttls
        smtpmail-smtp-service        587
        starttls-use-gnutls          t

        +notmuch-sync-backend        'mbsync
        +notmuch-mail-folder         "~/Mail"

        notmuch-archive-tags '("-inbox" "-unread" "+archived")

        notmuch-saved-searches
        '((:name "inbox" :query "tag:inbox" :key "i")
          (:name "archive" :query "tag:archived" :key "a")
          (:name "new" :query "tag:new" :key "n")
          (:name "unread" :query "tag:unread" :key "u")
          (:name "sent" :query "tag:sent" :key "t")
          (:name "drafts" :query "tag:draft" :key "d")
          (:name "all mail" :query "*" :key "*"))))

(defun notmuch-search-toggle-inbox ()
  "Toggle deleted tag for message."
  (interactive)
  (evil-collection-notmuch-toggle-tag "inbox" "search"))

(defun notmuch-search-toggle-archived ()
  "Toggle deleted tag for message."
  (interactive)
  (evil-collection-notmuch-toggle-tag "archived" "search"))

(defun notmuch-search-toggle-new ()
  "Toggle deleted tag for message."
  (interactive)
  (evil-collection-notmuch-toggle-tag "new" "search"))

(map! :map notmuch-search-mode
      :leader
      :prefix-map ("t" . "toggle")
      :n "i" #'notmuch-search-toggle-inbox
      :n "a" #'notmuch-search-toggle-archived
      :n "n" #'notmuch-search-toggle-new
      :n "u" #'evil-collection-notmuch-search-toggle-unread
      :n "d" #'evil-collection-notmuch-search-toggle-delete)
