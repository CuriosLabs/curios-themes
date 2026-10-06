# © 2025-2026 David BASTIEN
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

alias sudo="sudo "
alias src="source $HOME/.zshrc"                                             # reload zsh configuration
alias history="history -E 0"                                                # Force zsh to show the complete history with timestamp
alias update="sudo nixos-rebuild switch --upgrade && flatpak update -y"	    # NixOS all in one update
alias cool="fastfetch"                                                      # I always forget about this command name
alias rm="rm -I"                                                            # Better be safe
# Modern terminal tools
alias ls="eza -l --icons=auto"
alias cat="bat"
alias top="btop"
alias df="duf"
alias du="dust"
alias find="fd"
# CuriOS logo animation
alias logo="tte --frame-rate 120 -i /etc/nixos/logo.txt --anchor-text c --canvas-width 0 sweep --final-gradient-stops 1E78E4 4FD2FD --final-gradient-steps 12 12 --final-gradient-direction diagonal"
# Matrix effect
# alacritty --option 'window.startup_mode="Fullscreen"' -e tte.... ???? for a screensaver
alias matrix="tte -i /etc/nixos/logo.txt --anchor-text c --canvas-height 0 --canvas-width 0 matrix --rain-color-gradient 92be92 185318 --rain-fall-delay-range '8-25' --rain-column-delay-range '5-15' --rain-time 300 --symbol-swap-chance 0.005 --color-swap-chance 0.001 --resolve-delay 5 --final-gradient-stops 389c38 2cff05 --final-gradient-steps 12 12 --final-gradient-frames 5 --final-gradient-direction diagonal --highlight-color dbffdb"
# Help
alias help="curios-manager"
# Pi coding agent launched in a tmux session
alias skippy="tmux new -s skippy 'pi'"

# Keep 5000 lines of history within the shell and save it to ~/.zsh_history:
HISTSIZE=5000
SAVEHIST=5000
HISTFILE=~/.zsh_history
setopt INC_APPEND_HISTORY           # append command to history file
#export HISTTIMEFORMAT="%F %T "     # History time format ? bash format ?
setopt EXTENDED_HISTORY             # record command start time
setopt HIST_FIND_NO_DUPS            # do not save duplicated command

DISABLE_AUTO_TITLE="true"

# Bitwarden SSH agent
#export SSH_AUTH_SOCK=$HOME/.var/app/com.bitwarden.desktop/data/.bitwarden-ssh-agent.sock
# OR system SSH agent
#eval $(ssh-agent)
#ssh-add ~/.ssh/id_ed25519
# OR config pam_ssh

# For nerd fonts symbol, see: https://www.nerdfonts.com/cheat-sheet

# git functions
prompt_mytheme_is_git_dir() {
    cmd=$(git status 2>/dev/null)
    return $?
}

prompt_mytheme_update_git_status() {
    git_symbol='\ue702'
    ok_symbol=✅
    arrow_up_symbol=⬆️
    arrow_down_symbol=⬇️
    conflict_symbol=❌
    #git status --porcelain=v2 --branch --show-stash 2>/dev/null
    #git stash list
    #git rev-parse --abrev-ref HEAD --git-dir --git-common-dir 2>/dev/null

    if prompt_mytheme_is_git_dir; then
        GIT_NB_MODIF_FILES="$(git status -s -uno | wc -l)"
        PROMPT_GIT_NB_MODIF_FILES=""
        if [ "$GIT_NB_MODIF_FILES" -gt 0 ]; then
            PROMPT_GIT_NB_MODIF_FILES="|+${GIT_NB_MODIF_FILES}"
        else
            PROMPT_GIT_NB_MODIF_FILES="|${ok_symbol}"
        fi
        PROMPT_GIT_STATUS=" ${git_symbol} ($(git branch --show-current)${PROMPT_GIT_NB_MODIF_FILES})"
        echo -n "$PROMPT_GIT_STATUS"
    fi
}

# Python virtualenv
prompt_mytheme_update_venv() {
     python_symbol='\ue606'

     if [ -n "$VIRTUAL_ENV" ]; then
        PROMPT_VENV_BASE=" ${python_symbol} ($(basename $VIRTUAL_ENV))"
        echo -n "$PROMPT_VENV_BASE"
     fi
}

# Executed before each prompt
prompt_mytheme_set_title() {
    # Terminal Title
    #echo -ne "\033]0;$LOGNAME@$(hostname -s): $(pwd|cut -d "/" -f 4-100)\007"
    echo -ne "\033]0;$LOGNAME@$(hostname -s):$(pwd|sed "s|^$HOME|~|")\007"
}

prompt_mytheme_precmd() {
    prompt_mytheme_set_title
    PROMPT="$PROMPT_SYSTEM $PROMPT_DIRECTORY$(prompt_mytheme_update_git_status)$(prompt_mytheme_update_venv)$PROMPT_TIME$PROMPT_END$PROMPT_NEWLINE"
}

# Define custom theme, like fade but better IMO, see https://zsh.sourceforge.io/Doc/Release/Prompt-Expansion.html
prompt_mytheme_setup() {
    autoload -U add-zsh-hook
    add-zsh-hook precmd prompt_mytheme_precmd

    #prompt_symbol=🚀
    #prompt_symbol=😎
    #prompt_symbol='\uf31a' # Tux
    #prompt_symbol='\uf489' # Terminal
    prompt_symbol='\e843' # NixOS
    folder_symbol=📂
    clock_symbol=🕓

    font_color='white'
    bg_color='green' # black, red, green, yellow, blue, magenta, cyan or white
    if [ "$EUID" -eq 0 ]; then
        prompt_symbol=💀
        bg_color='red'
        font_color='white'
    elif [ "$EUID" -lt 900 ]; then
        prompt_symbol=🤖
        bg_color='yellow'
        font_color='white'
    fi

    # UTF-8 symbol code see: https://symbl.cc/en/25E4/ "$'\xe2\x97\xa4'"

    PROMPT_SYSTEM="%B%K{$bg_color}%F{$font_color}"$'\uF489'" %n@%m"
    # If current path has more than 3 sub-direcory, shortened it
    PROMPT_DIRECTORY="%K{blue}%F{$bg_color}"$'\uE0B0'" %F{white}${folder_symbol} %(3~|.../%2~|%~)"
    PROMPT_TIME="%K{yellow}%F{blue}"$'\uE0B0'" %F{white}${clock_symbol} %D{%T (%Z)}"
    PROMPT_END="%k%b%F{yellow}"$'\uE0B0'"%F{reset}"
    PROMPT_NEWLINE="$prompt_newline %B%F{$bg_color}"$'\xe2\xa4\xb7'"%b%f "

    # Guard against OhMyZsh themes overriding MyTheme.
    unset ZSH_THEME
}

# Add git status to precmd
# add-zsh-hook preexec update_git_status
# add-zsh-hook precmd update_git_status

# Set up the prompt
setopt PROMPT_SUBST
autoload -Uz promptinit && promptinit
# Add the custom theme to promptsys
prompt_themes+=( mytheme )
# And load it
prompt mytheme

# Use modern completion system
# Binded to Tab
if [ -d "$HOME/.zsh/completions" ]; then
  fpath=("$HOME/.zsh/completions" $fpath)
fi
autoload -Uz compinit
compinit -d ~/.cache/zcompdump
zstyle ':completion:*:*:*:*:*' menu select
zstyle ':completion:*' auto-description 'specify: %d'
zstyle ':completion:*' completer _expand _complete
zstyle ':completion:*' format 'Completing %d'
zstyle ':completion:*' group-name ''
zstyle ':completion:*' list-colors '${(s.:.)LS_COLORS}'
zstyle ':completion:*' list-prompt %SAt %p: Hit TAB for more, or the character to insert%s
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' rehash true
zstyle ':completion:*' select-prompt %SScrolling active: current selection at %p%s
zstyle ':completion:*' use-compctl false
zstyle ':completion:*' verbose true
zstyle ':completion:*:kill:*' command 'ps -u $USER -o pid,%cpu,tty,cputime,cmd'

# Custom Key bindings
bindkey '^f' autosuggest-accept # OR use bindkey -e for an emulation of VIM key bindings
bindkey '^p' history-search-backward # search through history based on completion
bindkey '^n' history-search-forward

# Shell integrations

# fzf integration
# by default, it is bound to Ctrl+r
eval "$(fzf --zsh)"

# zoxide integration
eval "$(zoxide init --cmd cd zsh)"

# Add npm local bin folder to $PATH
export PATH="$HOME/.npm-packages/bin:$PATH"

# Add local bin folder to $PATH
mkdir -p "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"

# source env default file
if [ -f "$HOME/.env" ]; then
  source "$HOME/.env"
fi

# Automated list directory with eza after a cd command.
function cd() {
  new_directory="$*";
  if [ $# -eq 0 ]; then
    new_directory=${HOME}
  fi
  builtin cd "${new_directory}" && /usr/bin/env eza -l --icons=auto
}
