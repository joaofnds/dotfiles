(let [dap (require :dap)
      dapui (require :dapui)]

  (set dap.adapters.delve
       {:type :server
        :port "${port}"
        :executable {:command :dlv :args ["dap" "-l" "127.0.0.1:${port}"]}})

  (set dap.configurations.go
       [{:type :delve
         :name :Debug
         :request :launch
         :program "${file}"}])

  (dapui.setup {})

  (set dap.listeners.after.event_initialized.dapui_config dapui.open)
  (set dap.listeners.before.event_terminated.dapui_config dapui.close)
  (set dap.listeners.before.event_exited.dapui_config dapui.close))
