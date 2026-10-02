return {
  "nvim-telescope/telescope.nvim",
  opts = function(_, opts)
    -- Extend defaults
    opts.defaults = vim.tbl_deep_extend("force", opts.defaults or {}, {
      vimgrep_arguments = {
        "rg",
        "--color=never",
        "--no-heading",
        "--with-filename",
        "--line-number",
        "--column",
        "--smart-case",
        "--hidden",
        "--no-ignore",
      },
    })

    -- Extend pickers
    opts.pickers = vim.tbl_deep_extend("force", opts.pickers or {}, {
      find_files = {
        hidden = true,
        no_ignore = true,
      },
      live_grep = {
        additional_args = function()
          return { "--hidden", "--no-ignore" }
        end,
      },
    })

    return opts
  end,
}
