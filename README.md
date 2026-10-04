# Curi*OS* default themes

These are [Curi*OS*](https://github.com/CuriosLabs/CuriOS)'s opinionated configuration dotfiles and themes to set up a
[COSMIC desktop environment](https://system76.com/cosmic/).
![CuriOS desktop](https://github.com/CuriosLabs/CuriOS/blob/testing/img/Tiles.png?raw=true "CuriOS = NixOS + COSMIC DE")

## Installation

These dotfiles are meant to be installed with the [curios-dotfiles](https://github.com/CuriosLabs/curios-dotfiles) program.
It comes pre-installed with [CuriOS](https://github.com/CuriosLabs/CuriOS).

## Features

- COSMIC desktop environment configuration files.
- Alacritty and Ghostty terminal themes.
- [OpenCode](https://opencode.ai/) configuration and plugin for log shell commands.
- [Zed](https://zed.dev/) editor themes and settings.
- `btop` custom configuration.
- `herdr` and `tmux` minimal configuration.
- LazyVim default starter configuration files.
- npm user configuration file.
- AI agent skills for the Curi*OS* system, [herdr](https://github.com/herdrdev/herdr),
  Docker, Brave browser and [Basecamp](https://github.com/basecamp/basecamp-cli).

## Color and theme

Available themes are:

- Catppuccin Macchiato
- COSMIC Dark
- Everforest Medium
- Gruvbox Dark
- Hackers Green
- Kanagawa
- Nord Dark
- Nord Light
- One Dark (default)
- Tokyo Night

References:

- [iTerm2 colors schemes](https://iterm2colorschemes.com/) for terminal colors.
- [COSMIC themes](https://cosmic-themes.org/).

## Build, Test, and Development Commands

This project uses [Just](https://github.com/casey/just) to manage development commands.
Run them inside the Nix shell with `nix-shell shell.nix --run "just"`.

- **Lint files**: Check code quality for agent-skill TypeScript files:

  ```bash
  nix-shell shell.nix --run "just lint"
  ```

- **Publish a new version**: Create a new git tag, push it, build it and update
the hash signature for the Nix package:

  ```bash
  nix-shell shell.nix --run "just publish 0.1.2"
  ```

- **Supported versions**: NixOS 26.05 or later, COSMIC 1.2.0.
