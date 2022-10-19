(local {: concat : map} (require :lume))

(fn capitalize [str]
  (str:gsub "^%l" string.upper))

(fn gen [words]
  [(map words string.upper)
   (map words string.lower)
   (map words capitalize)])

(let [boole (require :boole)]
  (boole.setup
    {:mappings {:increment "<C-a>"
                :decrement "<C-x>"}
     :additions
     (concat
       (gen [:foo :bar :baz :qux])
       (gen [:tic :tac :toe]))}))
