{:lazydef
 {1 "rcarriga/nvim-notify"
  :lazy true
  :init #(set vim.notify #((require :notify) $...))
  :opts {:stages :static
         :render :compact
         :timeout 4000
         :icons {:INFO  "I"
                 :WARN  "W"
                 :ERROR "E"
                 :DEBUG "D"
                 :TRACE "T"}}}}
