{:lazydef
 {1 "echasnovski/mini.notify"
  :event [:LspAttach]
  :init
  (fn []
    (fn temp-notify [...]
      (let [notify (require :mini.notify)]
        (set vim.notify (notify.make_notify))
        (vim.notify ...)))
    (set vim.notify temp-notify))
  :config
  (fn []
    (let [notify (require :mini.notify)]
      (notify.setup
       {:content {:format #(. $1 :msg)}
        :window {:config {:border :none}
                 :winblend 100}})))}}
