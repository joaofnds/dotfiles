{:lazydef
 {1 "iamcco/markdown-preview.nvim"
  :build #(vim.call "mkdp#util#install")
  :cmd [:MarkdownPreviewToggle :MarkdownPreview :MarkdownPreviewStop]
  :ft [:markdown]}}
