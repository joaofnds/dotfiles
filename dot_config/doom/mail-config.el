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

        notmuch-archive-tags '("-inbox" "-unread" "-new" "+archived")

        notmuch-saved-searches
        '((:name "inbox" :query "tag:inbox" :key "i")
          (:name "archive" :query "tag:archived" :key "a")
          (:name "new" :query "tag:new" :key "n")
          (:name "unread" :query "tag:unread" :key "u")
          (:name "sent" :query "tag:sent" :key "t")
          (:name "drafts" :query "tag:draft" :key "d")
          (:name "all mail" :query "*" :key "*"))))
