# Path to oh-my-zsh
export ZSH=$HOME/.oh-my-zsh

# ZSH theme (See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes)
ZSH_THEME="robbyrussell"

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git zsh-autosuggestions)

# Load oh-my-zsh
source $ZSH/oh-my-zsh.sh

# Set your language environment
export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
  export EDITOR='vim'
else
  export EDITOR='nvim'
fi

# ssh
export SSH_KEY_PATH="~/.ssh/id_rsa"

######################
# User configuration #
######################

# Set terminal to use 256colors
export TERM="xterm-256color"

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
[ -f $HOME/.aliases ] && source $HOME/.aliases
[ -f $HOME/.env ] && source $HOME/.env
[ -f $HOME/.hdw.env ] && source $HOME/.hdw.env
