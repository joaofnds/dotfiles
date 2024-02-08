(let [lazypath (.. (vim.fn.stdpath "data") "/lazy/lazy.nvim")]
  (when (not (vim.loop.fs_stat lazypath))
    (vim.fn.system ["git" "clone" "--filter=blob:none" "--branch=stable" "https://github.com/folke/lazy.nvim.git" lazypath]))
  (vim.opt.rtp:prepend lazypath))

(let [lazy (require :lazy)]
  (lazy.setup
    [(require :config.vim-sensible)   ;; sensible vim defaults
     (require :config.vim-rsi)        ;; readline keybinds
     (require :config.vim-repeat)     ;; repeat commands even after a plugin map
     (require :config.vim-commentary) ;; comment stuf out
     (require :config.vim-surround)   ;; mappings to {delete,change,add} surrounding pairs
     (require :config.plenary)        ;; the entire ecosystem uses this
     (require :config.easy-align)     ;; ain't nobody got time to align things manually
     (require :config.copilot)        ;; tab completion on steroids

     ;; git
     (require :config.neogit)   ;; git interface
     (require :config.diffview) ;; git diff interface
     (require :config.tardis)   ;; git-timemachine, for vim
     (require :config.gitsigns) ;; in-buffer git stuff

     (require :config.nerdtree)  ;; does the job (pretty well tbh)
     (require :config.which-key) ;; because I can't remeber every keybind
     (require :config.undotree)  ;; because history is not linear

     ;; shell integration
     (require :config.fzf)            ;; the best fuzzy finder
     (require :config.tmux-navigator) ;; jumping between vim and tmux, seamlessly
     (require :config.tmux-runner)    ;; run stuff on tmux, from vim

     (require :config.mason)         ;; lsp package manager
     (require :config.lsp-signature) ;; floating signature hint
     (require :config.null-ls)       ;; hook tools into nvim lsp api
     (require :config.trouble)       ;; make it double.
     (require :config.cmp)           ;; what was that method again?

     ;; visual
     (require :theme)               ;; works great with lua plugins
     (require :config.lualine-lazy) ;; pretty line
     (require :config.barbar)       ;; pretty tabline
     (require :config.notifier)     ;; non-intrusive notification system

     ;; languages
     (require :config.treesitter)         ;; oh that's pretty - Kramer
     (require :config.treesitter-context) ;; I keep forgetting where I am
     (require :config.treesj)             ;; join lines with treesitter

     (require :config.parinfer) ;; the superior way of writing lisp

     (require :config.markdown-preview) ;; 'cause I can't render markdown mentally

     (require :config.pairs)]

    {:defaults {:lazy true}
     :concurrency (vim.loop.available_parallelism)}))
