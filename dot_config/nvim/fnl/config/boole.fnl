(let [boole (require :boole)]
  (boole.setup
    {:mappings {:increment "<C-a>"
                :decrement "<C-x>"}
     :additions [[:foo :bar :baz :qux]]}))
