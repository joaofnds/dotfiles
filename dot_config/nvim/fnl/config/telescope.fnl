(let [telescope (require :telescope)
      actions (require :telescope.actions)]
  (telescope.setup
   {"defaults"
    {"mappings"
     {"i"
      {"<esc>" actions.close}}}}))
