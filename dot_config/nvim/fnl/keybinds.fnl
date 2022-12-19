(let [{: inoremap} (require :utils)]
  ;; undo breakpoints
  (each [_ c (ipairs ["," "." ";" "(" "[" "{"])]
    (inoremap c (.. c "<c-g>u"))))
