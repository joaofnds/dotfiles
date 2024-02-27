(let [lazypath (.. (vim.fn.stdpath "data") "/lazy/lazy.nvim")]
  (when (not (vim.loop.fs_stat lazypath))
    (vim.fn.system ["git" "clone" "--filter=blob:none" "--branch=stable" "https://github.com/folke/lazy.nvim.git" lazypath]))
  (vim.opt.rtp:prepend lazypath))

(macro load [config]
  `(. (require ,config) :lazydef))

(let [lazy (require :lazy)]
  (lazy.setup
   [(load :config.vim-rsi)    ;; readline keybinds
    (load :config.vim-repeat) ;; repeat commands even after a plugin map
    (load :config.comment)    ;; comment stuff out
    (load :config.surround)   ;; mappings to {delete,change,add} surrounding pairs
    (load :config.plenary)    ;; the entire ecosystem uses this
    (load :config.easy-align) ;; ain't nobody got time to align things manually
    (load :config.copilot)    ;; tab completion on steroids

    ;; git
    (load :config.neogit)   ;; git interface
    (load :config.diffview) ;; git diff interface
    (load :config.tardis)   ;; git-timemachine, for vim
    (load :config.gitsigns) ;; in-buffer git stuff

    (load :config.nerdtree)  ;; does the job (pretty well tbh)
    (load :config.which-key) ;; because I can't remember every keybind
    (load :config.undotree)  ;; because history is not linear

    ;; shell integration
    (load :config.fzf)            ;; the best fuzzy finder
    (load :config.tmux-navigator) ;; jumping between vim and tmux, seamlessly
    (load :config.tmux-runner)    ;; run stuff on tmux, from vim

    (load :config.mason)         ;; lsp package manager
    (load :config.lsp-signature) ;; floating signature hint
    (load :config.null-ls)       ;; hook tools into nvim lsp api
    (load :config.trouble)       ;; make it double.
    (load :config.cmp)           ;; what was that method again?

    ;; visual
    (load :theme)           ;; works great with lua plugins
    (load :config.lualine)  ;; pretty line
    (load :config.barbar)   ;; pretty tabline
    (load :config.notifier) ;; non-intrusive notification system

    ;; languages
    (load :config.treesitter)         ;; oh that's pretty - Kramer
    (load :config.treesj)             ;; join lines with treesitter

    (load :config.conjure)            ;; emacs all of a sudden

    (load :config.parinfer) ;; the superior way of writing lisp
    (load :config.leap)     ;; the superior way of moving around

    (load :config.markdown-preview) ;; 'cause I can't mentally render markdown

    (load :config.pairs)]
   {:performance
    {:rtp
     {:disabled_plugins
      [:gzip
       :matchit
       :matchparen
       :rplugin
       :spellfile
       :tarPlugin
       :tohtml
       :tutor
       :zipPlugin]}}
    :ui
    {:icons
     {:cmd "[cmd]"
      :config "[config]"
      :event "[event]"
      :ft "[ft]"
      :init "[init]"
      :import "[import]"
      :keys "[keys]"
      :lazy "💤"
      :loaded "[+]"
      :not_loaded "[-]"
      :plugin "[plugin]"
      :runtime "[runtime]"
      :require "[require]"
      :source "[source]"
      :start "[start]"
      :task "[task]"
      :list ["*" "+" "-" "."]}}}))
