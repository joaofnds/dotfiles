(let [noice (require :noice)]
  (noice.setup
    {:cmdline
     {:view "cmdline"
      :format
      {:cmdline {:icon ">"}
       :search_down {:icon "🔍⌄"}
       :search_up {:icon "🔍⌃"}
       :filter {:icon "$"}
       :lua {:icon "☾"}
       :help {:icon "?"}}}

     :presets
     {:bottom_search true
      :command_palette false}}))
