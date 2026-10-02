-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Terminal mode mappings
vim.keymap.set("t", "<esc><esc>", [[<C-\><C-n>]], { desc = "Exit terminal mode" })

-- Normal mode mappings
vim.keymap.set("n", "<leader>wt", ":vsplit | terminal<CR>", { desc = "Terminal in vertical split" })
vim.keymap.set("n", "<leader>wy", ":split | terminal<CR>", { desc = "Terminal in horizontal split" })
vim.keymap.set("n", "<leader>wO", ":vsplit | terminal opencode<CR>", { desc = "Opencode AI in vertical split" })
vim.keymap.set("n", "<leader>wP", ":vsplit | terminal pi<CR>", { desc = "Pi AI in vertical split" })
vim.keymap.set("n", "<leader><tab>t", ":tabnew | terminal<CR>", { desc = "Terminal in new tab" })
vim.keymap.set("n", "<leader><tab>p", "<cmd>tabprevious<cr>", { desc = "Previous Tab" })
vim.keymap.set("n", "<leader><tab>n", "<cmd>tabnext<cr>", { desc = "Next Tab" })

-- Transparency Toggle
_G.transparency_enabled = true -- We started with it enabled in colorschemes.lua
function _G.toggle_transparency()
  _G.transparency_enabled = not _G.transparency_enabled
  if _G.transparency_enabled then
    vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
    vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
    vim.api.nvim_set_hl(0, "NormalNC", { bg = "none" })
    vim.api.nvim_set_hl(0, "ColumnBorder", { bg = "none" })
    print("Transparency Enabled")
  else
    -- Reloading the current colorscheme restores the original background
    vim.cmd("colorscheme " .. vim.g.colors_name)
    print("Transparency Disabled")
  end
end

vim.keymap.set("n", "<leader>ut", toggle_transparency, { desc = "Toggle Transparency" })
vim.api.nvim_create_user_command("ToggleTransparency", toggle_transparency, {})
