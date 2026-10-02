-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
--
-- Add any additional autocmds here
-- with `vim.api.nvim_create_autocmd`
--
-- or remove existing autocmds by their group name (which is prefixed with `lazyvim_` for the defaults)
-- e.g. vim.api.nvim_del_augroup_by_name("lazyvim_wrap_spell")

-- Function to apply Vibrant Terminal Colors (ANSI) - Synchronized with Alacritty One-Dark
local function apply_terminal_colors()
  vim.g.terminal_color_0  = "#241f31" -- Black
  vim.g.terminal_color_1  = "#c01c28" -- Red
  vim.g.terminal_color_2  = "#2ec27e" -- Green
  vim.g.terminal_color_3  = "#f5c211" -- Yellow
  vim.g.terminal_color_4  = "#1e78e4" -- Blue
  vim.g.terminal_color_5  = "#9841bb" -- Magenta
  vim.g.terminal_color_6  = "#0ab9dc" -- Cyan
  vim.g.terminal_color_7  = "#f6f5f4" -- White
  vim.g.terminal_color_8  = "#5e5c64" -- Bright Black
  vim.g.terminal_color_9  = "#ed333b" -- Bright Red
  vim.g.terminal_color_10 = "#57e389" -- Bright Green
  vim.g.terminal_color_11 = "#f8e45c" -- Bright Yellow
  vim.g.terminal_color_12 = "#51a1ff" -- Bright Blue
  vim.g.terminal_color_13 = "#ff06b5" -- Bright Magenta
  vim.g.terminal_color_14 = "#4fd2fd" -- Bright Cyan
  vim.g.terminal_color_15 = "#ffffff" -- Bright White
end

-- Auto-reload colorscheme when changed externally
local function reload_colorscheme()
  local colorschemes_file = vim.fn.stdpath("config") .. "/lua/plugins/colorschemes.lua"
  local f = io.open(colorschemes_file, "r")
  if not f then
    return
  end
  local content = f:read("*all")
  f:close()
  local theme = content:match('colorscheme = "([^"]+)"')
  if theme and theme ~= vim.g.colors_name then
    vim.schedule(function()
      local ok, _ = pcall(vim.cmd, "colorscheme " .. theme)
      if ok then
        -- Re-apply our custom terminal colors after the theme load
        apply_terminal_colors()
        -- Also trigger transparency toggle if it was enabled
        if _G.transparency_enabled then
          vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
          vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
          vim.api.nvim_set_hl(0, "NormalNC", { bg = "none" })
          vim.api.nvim_set_hl(0, "ColumnBorder", { bg = "none" })
        end
      end
    end)
  end
end

local config_dir = vim.fn.stdpath("config") .. "/lua/plugins"
local watcher = vim.uv.new_fs_event()
if watcher then
  watcher:start(
    config_dir,
    {},
    vim.schedule_wrap(function(err, filename)
      if not err and filename == "colorschemes.lua" then
        reload_colorscheme()
      end
    end)
  )
end

-- Enforce Vibrant Terminal Colors (ANSI) - Synchronized with Alacritty One-Dark
-- We use an autocmd because many themes overwrite these variables when they load.
vim.api.nvim_create_autocmd("ColorScheme", {
  pattern = "*",
  callback = function()
    apply_terminal_colors()
  end,
})

-- Enable Treesitter highlighting (Neovim 0.12+)
vim.api.nvim_create_autocmd("FileType", {
  pattern = {
    "bash",
    "html",
    "javascript",
    "json",
    "lua",
    "markdown",
    "python",
    "query",
    "regex",
    "tsx",
    "typescript",
    "vim",
    "yaml",
  },
  callback = function()
    pcall(vim.treesitter.start)
  end,
})
