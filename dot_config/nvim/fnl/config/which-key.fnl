(let [wk (require :which-key)]
  (wk.register
    {:<leader>
     {:<leader> [":FZF<cr>" "find files: searches whole project for a file"]
      :. [":FZF %:p:h<cr>" "search for a file in the current directory"]
      :w {:name "window"
          :- [ ":wincmd _<cr>:wincmd |<cr>" "zoom in"]
          := [":wincmd =<cr>" "re-balance windows"]
          :_ [":wincmd _<cr>" "max out the height"]
          :| [":wincmd |<cr>" "max out the width"]
          :N [":new<cr>" "new empty window"]
          :V [":bnew<cr>" "new vertical empty window"]
          :s [":sp<cr>" "open a horizontal split"]
          :v [":vsp<cr>" "open a vertical split"]
          :q [":q<cr>" "close current window"]
          :B [":wincmd T<cr>" "break out split into window"]
          :o [":wincmd o<cr>" "kill other windows"]
          :r [":wincmd r<cr>" "swaps windows"]
          :h [":wincmd h<cr>" "moves the cursor buffer on the left"]
          :j [":wincmd j<cr>" "moves the cursor buffer on the bottom"]
          :k [":wincmd k<cr>" "moves the cursor buffer on the top"]
          :l [":wincmd l<cr>" "moves the cursor buffer on the right"]
          :H [":wincmd H<cr>" "moves buffer to the left"]
          :J [":wincmd J<cr>" "moves the buffer to the bottom"]
          :K [":wincmd K<cr>" "moves the buffer to the top"]
          :L [":wincmd L<cr>" "moves cursor buffer to the right"]}
      :f {:name "file"
          :t [":vsplit ~/TODO.md<cr>" "file todo: opens TODO.md in a vertical split"]
          :s [":w<cr>" "writes the buffer"]}
      :s {:name "search"
          :p [":Ag<cr>" "search project"]}
      :b {:name "buffers"
          :b [":Buffers<cr>" "search buffers"]}
      :o {:name "open"
          :- [":e .<cr>" "open the current folder"]}
      :c {:name "code"
          :c [vim.lsp.buf.code_action "action"]
          :r [vim.lsp.buf.rename "rename"]
          :s [vim.lsp.buf.signature_help "signature"]
          :f [vim.lsp.buf.formatting "format"]
          :l {:name "lsp"
              :s [":LspStart<cr>" "start"]
              :S [":LspStop<cr>" "stop"]}}}
     :g {:d [vim.lsp.buf.definition "definition"]
         :i [vim.lsp.buf.implementation "implementation"]
         :r [vim.lsp.buf.references "references"]}
     :K [vim.lsp.buf.hover]}))
