---
name: curios
description:
  Manage CuriOS, a Linux distribution based on NixOS. Use it when the user asks to
  do a system update or upgrade, add or remove a package, check if a package is
  installed, search for a package name, change or check a system or module
  configuration or NixOS option using the `curios-update` tool.
  Install and manage dotfiles, themes, wallpapers, and COSMIC desktop settings
  using the `curios-dotfiles` tool.
metadata:
  author: CuriosLabs
  version: "1.6.0"
---

# Curios System Manager Skill

This skill provides a comprehensive interface for managing the CuriOS Linux system,
a Linux distribution based on NixOS. It leverages the `curios-update` utility to
perform system-level operations.
CuriOS follows a highly modular architecture, leveraging Nix modules to define
its system configuration.
This skill also allows the agent to install and configure CuriOS-specific dotfiles,
wallpapers, and themes for the COSMIC desktop environment. It leverages the
`curios-dotfiles` utility.

## Quick reference

> **Note**: Most modifying commands (update, upgrade, add-pkg, update-module)
> require `sudo`. Commands starting with `sudo` should be prefixed with
> `xdg-terminal-exec` so a new terminal opens and the user can type their
> password (AI agents usually do not have sudo rights).

| Task | Command |
|------|---------|
| Update all Nix packages and flakes, then garbage-collect | `sudo curios-update --update` |
| Upgrade to the latest distribution version and update | `sudo curios-update --upgrade` |
| Search for a CuriOS module | `curios-update --search-modules <name>` |
| Query a NixOS/CuriOS option | `curios-update --nixos-option <key>` |
| Update a CuriOS module setting | `sudo curios-update --update-module <key> <value>` |
| Show all CuriOS module settings as JSON | `curios-update --show-modules` |
| Search for a NixOS service by name | `nixos-option services \| grep -i <name>` |
| List all options of a NixOS service | `nixos-option -r services.<name>` |
| Search for a NixOS program module by name | `nixos-option programs \| grep -i <name>` |
| List all options of a NixOS program module | `nixos-option -r programs.<name>` |
| Search for a NixOS package by name | `curios-update --search-pkgs <name>` |
| Install a NixOS package | `sudo curios-update --add-pkg <attr_name>` |
| Determine system language/keyboard settings | `curios-update --nixos-option curios.system.keyboard` |
| List available themes | `curios-dotfiles --list` |
| Apply a theme (e.g. One Dark, Catppuccin Macchiato, Tokyo Night) | `curios-dotfiles --themes <theme> "$HOME"` |

## Common workflows

### Update the system

Update the entire system, all packages and Nix flakes, and run Nix garbage collection:

```bash
sudo curios-update --update
```

### Upgrade the system

Check if a new version of CuriOS is available:

```bash
curios-update --check --verbose
```

and, if so, upgrade (this also runs an update):

```bash
sudo curios-update --upgrade
```

`curios-update` clones the CuriOS source from its Git repository during an upgrade.
The Git repository URL is read from the option "curios.core.source.url"; see
`curios-update --nixos-option curios.core.source.url`.
The repository branch is set by "curios.core.source.branch", which defaults to "stable".
The "testing" branch should only be used by developers contributing to the CuriOS project.
The "unstable" branch follows the NixOS unstable channel. Things may break; use it with caution.

### System modules and configuration

When installing or checking a package, you **MUST** first verify whether the package
is defined as a CuriOS **module**. These modules are defined as JSON keys, e.g.
"curios.desktop.browser.firefox.enable" for the Firefox package. This key is
used as a parameter for the `--update-module` and `--nixos-option` options.

```bash
# Search for the module key by name. JSON output: choose the leaf key, not the branch.
curios-update --search-modules <name>
# Query the module option to know more (works for any NixOS option too)
curios-update --nixos-option <key>
# Change the module setting
sudo curios-update --update-module <key> <value>
# you MUST update the system after a setting change
sudo curios-update --update
```

All modules can be shown (JSON output) with:

```bash
curios-update --show-modules
```

**IF** a package does **NOT** exist as a CuriOS module, you **MUST** then check
whether a NixOS **service** exists for it **BEFORE** falling back to a regular
NixOS package. A NixOS service is usually a server/daemon: installing the bare
package (`pkgs.<name>`) does little, while configuring the options under
`services.<name>.*` gives an operational service started and managed by systemd.

```bash
# Search for a service matching the name (case-insensitive)
nixos-option services | grep -i <name>
# If grep matches, list all the options of this service (recursive)
nixos-option -r services.<name>
# Configure the service via its options in /etc/nixos/settings.nix,
# e.g. services.unifi.enable = true; then apply the change and update the
# system: see the "## Advanced usage" workflow below
```

Like all `services.*` options, they are set in `/etc/nixos/settings.nix`; to
prepare, validate and apply the change, follow the **Advanced usage** workflow
below.

**IF** no NixOS service matches, check next whether a NixOS **program module**
exists (`programs.<name>.*`). Unlike a service, a program module is a
user-facing application: `programs.<name>.enable = true` installs the package
system-wide and may add system-wide configuration (e.g.
`programs.firefox.preferences`), but it does **NOT** start a daemon. Some
packages have both a `services.*` and a `programs.*` module (e.g. Emacs).

```bash
# Search for a program module matching the name (case-insensitive)
nixos-option programs | grep -i <name>
# If grep matches, list all the options of this program module (recursive)
nixos-option -r programs.<name>
# Configure it via its options in /etc/nixos/settings.nix,
# e.g. programs.<name>.enable = true; then apply: see "## Advanced usage" below
```

So the search order is always: **CuriOS module → NixOS service (`services.*`)
→ NixOS program module (`programs.*`) → NixOS package**.

**IF** a package does **NOT** exist as a CuriOS module, **NOR** as a NixOS service,
**NOR** as a NixOS program module, it should be searched and installed as a
regular NixOS package:

```bash
# Notice the 'package_attr_name' value of the JSON output; the first result should be the best match.
# Also notice the 'package_programs' value, a JSON array of programs provided by this package.
curios-update --search-pkgs <name>
# Pass the 'package_attr_name' as a parameter to the '--add-pkg' option.
sudo curios-update --add-pkg <pkg_attr_name>
```

## Flatpak

IF an application does NOT exist as a CuriOS module, a NixOS service, a NixOS
program module OR a NixOS package, THEN it can be installed as a Flatpak.
CuriOS comes with the "flathub" and "cosmic" repositories pre-configured.

```bash
# List remote repositories
flatpak remotes
# List installed apps
flatpak list --app
# List available apps on the Flathub remote repository
flatpak remote-ls flathub
# Install an app
flatpak install flathub <app_ID>
# Launch the app
flatpak run <app_ID>
```

A GUI for the Flatpak store is also available with:

```bash
cosmic-store
```

## Change desktop theme, keyboard layout, update dotfiles

- **Discovery**: Use `curios-dotfiles --help` to check options.
- List themes: use `curios-dotfiles --list` to check available themes.
- Default theme is `One Dark`.

Change the current theme with:

```bash
# Change the user's $HOME desktop theme to Gruvbox Dark
curios-dotfiles --themes 'Gruvbox Dark' "$HOME"
```

Theme configuration is read from `$HOME/.curios/themes/themes.json`. It lists
all themes available through `curios-dotfiles --list`. It defines the theme files
used by the COSMIC desktop environment (`*.ron` files), Alacritty, and Ghostty.
It also defines the theme names used by `nvim`, and `zeditor`, and the base
color for the Brave browser.
Wallpapers are stored under `$HOME/.curios/wallpapers/`. Each theme can define its
own wallpapers sub-directory with the "wallpapers" key. Check which wallpapers
directory is currently used with:
`cat $HOME/.config/cosmic/com.system76.CosmicBackground/v1/all | grep "source"`

Change the COSMIC keyboard layout (e.g. French) with: `curios-dotfiles --lang fr`
The current system keyboard setting can be found with: `curios-update --nixos-option curios.system.keyboard`

Themes are sourced from a Git repository defined by `curios-update --nixos-option curios.core.dotfiles.url`
and `curios-update --nixos-option curios.core.source.branch`. Themes and dotfiles
can be upgraded from the Git repository source with the command:
`curios-dotfiles --upgrade --lang us "$HOME"`
By default, the COSMIC keyboard layout is set to "us". Change it if necessary
with the "--lang" option.

## TUI manager

CuriOS comes with a TUI: curios-manager (shortcut: Super+Return).

Launch it with: `xdg-terminal-exec curios-manager`

From the TUI the user can update and upgrade the system, add or remove packages,
update the hardware firmware, set up a backup, and monitor the system (disk usage,
btop, inspect network connections). They can also change the desktop theme, enroll
keys for PAM or full-disk decryption, enable AppArmor, and enable secure boot.

## Documentation

Up-to-date online [documentation is here](https://github.com/CuriosLabs/CuriOS/blob/master/docs/index.md).
The same documentation should be available offline here: `/etc/nixos/docs/`.

## When to use me

- When the user wants to update their system or install a package.
- When a user needs to search for a NixOS service (server/daemon) or install a new NixOS package.
- When modifying CuriOS-specific desktop or system modules (e.g., changing
  timezones, enabling browsers).
- When checking for system updates or upgrading to a new CuriOS release.
- When inspecting current NixOS or CuriOS configuration options.
- When a user wants to install the CuriOS dotfiles in their home directory.
- When a user wants to change their overall system theme (colors for Alacritty,
  Neovim, Zed, the COSMIC desktop environment, etc.).
- When a user needs to set their COSMIC keyboard layout during dotfiles installation.

## Advanced usage

**NEVER** edit files under `/etc/nixos/` except `/etc/nixos/settings.nix` and
`/etc/nixos/modules.json`.
Those 2 files are the **only** NixOS configuration files that are preserved across
system upgrades. Any other file in `/etc/nixos/` will be overwritten on upgrade.

This is also where NixOS **service** options are configured, e.g.
`services.unifi.enable = true;` in the `services` attribute set of `settings.nix`.

`/etc/nixos/settings.nix` requires `sudo` to write. AI agents usually do **not**
have sudo rights. Do **not** run `sudo` yourself. Use this safe workflow instead:

1. **Start from the existing file** — always copy the current configuration to a
   temp file first, never write from scratch:

   ```bash
   cp /etc/nixos/settings.nix /tmp/settings.nix
   ```

2. **Agent: modify the temp file** `/tmp/settings.nix` (add or change the desired
   options, e.g. the `services.<name>.*` options of a service).
3. **User validation** — show the user exactly what changed and wait for their
   approval before applying anything:

   ```bash
   diff -u --color=always /etc/nixos/settings.nix /tmp/settings.nix
   ```

   The user can also open `/tmp/settings.nix` in an editor to review it manually.
4. **User applies with sudo** — once validated, launch the copy and the system
   update in **one** terminal via `xdg-terminal-exec`. That opens a new window
   where the user types their sudo password:

   ```bash
   xdg-terminal-exec bash -c 'sudo cp /tmp/settings.nix /etc/nixos/settings.nix && sudo curios-update --update'
   ```

## NixOS useful commands

```bash
# List system generations
nixos-rebuild list-generations
# Garbage-collect the Nix store (keep generations newer than 3 days)
xdg-terminal-exec sudo nix-collect-garbage --delete-older-than 3d
# Try a package without installing it
nix-shell -p <pkg>
# List user profile packages
nix profile list
# Validate the Nix syntax of a config file without evaluating it
# (e.g. check /tmp/settings.nix before applying it to /etc/nixos/settings.nix)
nix-instantiate --parse /tmp/settings.nix
```

## Important Notes

- **Discovery**: Use `curios-update --help` to explore the latest options
  and command syntax.
