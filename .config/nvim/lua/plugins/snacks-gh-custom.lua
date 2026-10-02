-- ~/.config/nvim/lua/plugins/snacks-gh-custom.lua
-- Extensions des actions GitHub dans snacks.nvim
-- Ajoute "Checkout PR to custom branch" et "Change PR base branch" au menu d'actions

return {
  {
    "folke/snacks.nvim",
    opts = function(_, opts)
      -- Monkey-patch après le chargement complet de snacks
      vim.defer_fn(function()
        local ok, Actions = pcall(require, "snacks.gh.actions")
        if not ok then
          vim.notify("snacks.gh.actions not found, skipping custom GH actions", vim.log.levels.WARN)
          return
        end

        local Api = require("snacks.gh.api")

        -- Helper : liste les branches distantes (origin/*)
        local function get_remote_branches()
          local output = vim.fn.system("git branch -r --format='%(refname:short)'")
          if vim.v.shell_error ~= 0 then
            return {}
          end

          local branches = {}
          local seen = {}
          for _, line in ipairs(vim.split(vim.trim(output), "\n", { plain = true, trimempty = true })) do
            local branch = line:gsub("^origin/", "")
            if branch ~= "" and not seen[branch] then
              seen[branch] = true
              table.insert(branches, branch)
            end
          end
          table.sort(branches)
          return branches
        end

        -- 1. Checkout PR dans une branche personnalisée
        Actions.actions.gh_checkout_custom = {
          desc = "Checkout PR to custom branch",
          icon = " ",
          priority = 10,
          type = "pr",
          action = function(item, ctx)
            local branches = get_remote_branches()
            if #branches == 0 then
              Snacks.notify.warn("No remote branches found", { title = "Checkout PR" })
              return
            end

            Snacks.picker.select(branches, {
              prompt = "Select branch for checkout: ",
              title = "Checkout PR #" .. item.number .. " to branch",
            }, function(choice, idx)
              if not choice then
                return
              end

              Api.cmd(function()
                Snacks.notify.info("Checked out PR #" .. item.number .. " to branch " .. choice)
              end, {
                args = { "pr", "checkout", tostring(item.number), "--branch", choice },
                repo = item.repo,
                on_error = function(msg)
                  Snacks.notify.error(msg or "Failed to checkout PR", { title = "Checkout PR" })
                end,
              })
            end)
          end,
        }

        -- 2. Changer la branche cible du PR
        Actions.actions.gh_change_base = {
          desc = "Change PR base branch",
          icon = " ",
          priority = 9,
          type = "pr",
          enabled = function(item)
            return item.state == "open"
          end,
          action = function(item, ctx)
            local branches = get_remote_branches()
            local current_base = item.baseRefName or ""
            local filtered = {}

            for _, b in ipairs(branches) do
              if b ~= current_base then
                table.insert(filtered, b)
              end
            end

            if #filtered == 0 then
              Snacks.notify.warn("No other remote branches found", { title = "Change Base Branch" })
              return
            end

            Snacks.picker.select(filtered, {
              prompt = "Select new base branch: ",
              title = "Change base branch for PR #" .. item.number,
            }, function(choice, idx)
              if not choice then
                return
              end

              Api.cmd(function()
                Snacks.notify.info("Changed base branch of PR #" .. item.number .. " to " .. choice)
              end, {
                args = { "pr", "edit", tostring(item.number), "--base", choice },
                repo = item.repo,
                on_error = function(msg)
                  Snacks.notify.error(msg or "Failed to change base branch", { title = "Change Base Branch" })
                end,
              })
            end)
          end,
        }
      end, 100)

      return opts
    end,
  },
}
