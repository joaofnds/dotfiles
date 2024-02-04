{1 "rcarriga/nvim-dap-ui"
 :config
  (fn []
   (let [dap (require :dap) dapui (require :dapui)]
    (dapui.setup {})
    (set dap.listeners.after.event_initialized.dapui_config dapui.open)
    (set dap.listeners.before.event_terminated.dapui_config dapui.close)
    (set dap.listeners.before.event_exited.dapui_config dapui.close)))}
