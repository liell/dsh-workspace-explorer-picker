# dsh-workspace-explorer-picker

> **DeepSeek Harness Desktop** plugin â€” opens the native **Windows Explorer folder picker** directly when you add a workspace, instead of the in-app directory browser.

When you click **Add workspace** in DeepSeek Harness Desktop, this plugin skips the
in-app "Select Workspace Directory" browser (a dialog rendered inside the web GUI)
and opens the real **Windows Explorer** folder dialog immediately â€” the same chooser
the shell already uses for its "Choose with Windows" action.

## Requirements

- **Windows** (the Explorer chooser is a Windows-only shell feature)
- **DeepSeek Harness Desktop** (the Electron desktop app) â€” this plugin targets the
  desktop shell and its native picker bridge
- The GUI must be opened through the app (its window, or the browser tab the app
  opens). Outside the desktop shell, the plugin falls back to the host
  directory-picker seam.

## How it works

DeepSeek Harness Desktop composes the web GUI from Cordis bundles and applies a
user patch layer from `$DSH_HOME/profiles/<profile>/cordis.patch.yml`. The stock
"add workspace" flow fills a UI slot with an in-app directory browser. This plugin
is a *renderless* client plugin that occupies the same directory-flow slots and,
on open, calls the desktop shell's own native picker:

- `window.__DSH_DESKTOP_PICK_DIRECTORY__` â†’ Electron `dialog.showOpenDialog`
  (`openDirectory`) â€” the Windows Explorer folder dialog
- fallback: the host `workspaces.pickDirectory()` directory-picker seam

Because everything lives in the user profile (`$DSH_HOME`), it **survives DSH
Desktop updates** â€” updates replace the app in `Program Files`, never your profile.

## Install

Requires PowerShell. From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

This copies the plugin into `$DSH_HOME\profiles\node_modules\dsh-workspace-explorer-picker`
and applies the activation rows to `$DSH_HOME\profiles\desktop\cordis.patch.yml`
(idempotent â€” safe to re-run).

Then **restart DeepSeek Harness Desktop**. Clicking **Add workspace** now opens the
Windows Explorer folder picker.

### Manual install

1. Copy the `lib` folder and `package.json` into
   `$DSH_HOME\profiles\node_modules\dsh-workspace-explorer-picker\`
   (`$DSH_HOME` defaults to `~/.dsh`).
2. Append to `$DSH_HOME\profiles\desktop\cordis.patch.yml`:

```yaml
- id: directory-picker
  disabled: true
- insert:
    - id: directory-picker-explorer
      name: 'dsh-workspace-explorer-picker'
```

3. Restart DeepSeek Harness Desktop.

## Uninstall

1. Remove the rows added above from `cordis.patch.yml` (or restore a backup).
2. Delete `$DSH_HOME\profiles\node_modules\dsh-workspace-explorer-picker`.
3. Restart DeepSeek Harness Desktop.

## Notes & limitations

- The in-app browser backend (`directory-picker` auto row) is disabled by the
  patch; the Explorer chooser replaces it for both the conversation hero and the
  sidebar "Add workspace" actions.
- The desktop shell's picker is available when the GUI is loaded by the app
  (window or app-opened browser tab). In a plain browser session without the
  desktop bridge, the plugin falls back to the host directory-picker seam (which
  needs a backend mounted â€” e.g. the stock `directory-picker-auto`).
- No volume restrictions are applied (the shell's picker is used without the
  desktop "safe volume" validation, so any accessible folder works, including
  exFAT/FAT32/network volumes).

## Development / publishing

The loader only needs `package.json` (with the `dsh.client` declaration) and
`lib/`. Build-free: `lib/client.js` is a `window.__ModuleLoader__.load`
bundle mirroring the official `@deepseek-ai/dsh-client-ui-directory-picker-native`
structure.

```powershell
npm pack          # produce the .tgz
git tag v1.0.0    # when publishing
npm publish       # public registry (add your repo URL to package.json first)
```

## License

MIT
