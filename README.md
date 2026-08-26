# dsh-workspace-explorer-picker

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6.svg)](#requirements)
[![Target](https://img.shields.io/badge/target-DeepSeek%20Harness%20Desktop-4F46E5.svg)](#)
[![npm version](https://img.shields.io/npm/v/dsh-workspace-explorer-picker.svg)](https://www.npmjs.com/package/dsh-workspace-explorer-picker)

> A **DeepSeek Harness Desktop** plugin that opens the native **Windows Explorer folder picker** directly when you add a workspace - no more in-app directory browser.

Clicking **Add workspace** in DeepSeek Harness Desktop normally opens a directory
browser rendered inside the web GUI. This plugin skips that dialog entirely and
opens the real **Windows Explorer** folder chooser immediately - the same native
dialog the shell already uses for its "Choose with Windows" action.

## Features

- Opens the **native Windows Explorer folder dialog** directly from "Add workspace"
  (both the conversation hero and the sidebar).
- **Renderless** client plugin - no UI of its own to maintain.
- Uses the desktop shell's own picker (Electron `dialog.showOpenDialog`) - full
  Explorer experience (Quick Access, breadcrumbs, search, New folder).
- **Survives DSH Desktop updates**: installed under `$DSH_HOME` (user profile),
  never inside `Program Files`.
- **Idempotent installer** (`install.ps1`) for quick setup on any machine.
- **No volume restrictions**: pick any accessible folder, including exFAT/FAT32
  and network volumes.
- **Market-ready**: declares `dsh.bundle.patch`, so it can be installed from the
  DSH Community Market / npm.

## Table of Contents

- [Requirements](#requirements)
- [Install](#install)
- [Market & npm](#market--npm)
- [How it works](#how-it-works)
- [Uninstall](#uninstall)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Publishing](#publishing)
- [License](#license)

## Requirements

| Requirement | Detail |
| --- | --- |
| OS | **Windows** (the Explorer chooser is a Windows-only shell feature) |
| App | **DeepSeek Harness Desktop** (the Electron desktop app) |
| GUI entry | The app window, or the browser tab the app opens (the desktop picker bridge must be present) |

Outside the desktop shell, the plugin falls back to the host directory-picker seam.

## Install

### Automatic (recommended)

Requires PowerShell. From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

What it does:

1. Copies the plugin into `$DSH_HOME\profiles\node_modules\dsh-workspace-explorer-picker\`
   (`$DSH_HOME` defaults to `~/.dsh`).
2. Appends the activation rows to `$DSH_HOME\profiles\desktop\cordis.patch.yml`.
3. Prints a confirmation - then **restart DeepSeek Harness Desktop**.

The script is idempotent: re-running it is safe.

### Manual

1. Copy the `lib` folder, `cordis.patch.yml` and `package.json` to
   `$DSH_HOME\profiles\node_modules\dsh-workspace-explorer-picker\`.
2. Append to `$DSH_HOME\profiles\desktop\cordis.patch.yml`:

```yaml
- id: directory-picker
  disabled: true
- insert:
    - id: directory-picker-explorer
      name: 'dsh-workspace-explorer-picker'
```

3. Restart DeepSeek Harness Desktop.

### Verify

After restarting, click **Add workspace** - the Windows Explorer folder dialog
should open immediately. If nothing happens, check the logs under
`%APPDATA%\DSH Desktop\logs\` (see [Troubleshooting](#troubleshooting)).

## Market & npm

DeepSeek Harness Desktop's Community Market installs plugins from **npm** when the
package declares a `dsh.bundle.patch` (this plugin does - see
`cordis.patch.yml`). The bundle patch disables the stock adaptive picker and
inserts this plugin, so the manual profile patch above is **not needed** when the
plugin is installed as a bundle.

1. **Publish to npm** so the market can resolve an install target:

   ```powershell
   npm login
   npm publish
   ```

2. **Get listed in a catalog** (e.g. dshfind): submit your package at
   `https://dshfind.com` following their submission flow. The catalog verifies
   the repository backlink (`repository` in `package.json` points to your
   GitHub repo) before accepting structured install evidence.

3. **Users install** it from the market (Plugins / Market in DSH Desktop
   settings): the Host runs `pnpm add dsh-workspace-explorer-picker`, applies
   the bundle patch, and adds it to the profile bundles.

## How it works

DeepSeek Harness Desktop composes its web GUI from Cordis bundles and applies a
user patch layer from `$DSH_HOME/profiles/<profile>/cordis.patch.yml`. The stock
"add workspace" flow fills a UI slot with the in-app directory browser.

This plugin is a *renderless* client plugin that occupies the same directory-flow
slots (`conversation.hero.workspace.directoryFlow` and
`sidebar.workspaces.directoryFlow`) and, on each open, picks a folder:

1. `window.__DSH_DESKTOP_PICK_DIRECTORY__` - the DSH Desktop shell bridge
   (Electron `dialog.showOpenDialog` with `openDirectory`) - the Windows Explorer
   folder dialog.
2. Fallback: the host `workspaces.pickDirectory()` directory-picker seam.

The patch row `directory-picker` (the stock adaptive picker) is disabled so the
in-app browser never appears.

Because everything lives under `$DSH_HOME`, updates to DSH Desktop (which replace
`Program Files`) never touch the plugin.

## Uninstall

1. Remove the patch rows from `cordis.patch.yml` (see [Manual install](#manual)).
2. Delete `$DSH_HOME\profiles\node_modules\dsh-workspace-explorer-picker`.
3. Restart DeepSeek Harness Desktop.

## Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| "Add workspace" still opens the in-app browser | The app was not restarted, or the patch was not applied. Re-run `install.ps1` and restart DSH Desktop. |
| Nothing happens when clicking "Add workspace" | The plugin failed to activate. Check `%APPDATA%\DSH Desktop\logs\` and confirm the package folder exists under `profiles\node_modules`. |
| The picker opens but the workspace is rejected | The workspace service validates the path server-side; pick a directory you can read and write. |
| Pick falls back to the host seam unexpectedly | The GUI was opened without the desktop bridge (e.g. a manually typed URL). Open the GUI through the app instead. |

## Development

The loader only needs `package.json` (with the `dsh.client` and
`dsh.bundle.patch` declarations) and `lib/`. There is no build step:
`lib/client.js` is a `window.__ModuleLoader__.load` bundle mirroring the
structure of the official `@deepseek-ai/dsh-client-ui-directory-picker-native`
plugin.

```
dsh-workspace-explorer-picker/
|-- lib/
|   |-- index.js        # host half (no-op; the plugin is client-only)
|   |-- client.js       # browser half: renderless directory-flow occupant
|   `-- types/          # TypeScript declarations
|-- cordis.patch.yml    # bundle patch (dsh.bundle.patch) - activates the plugin
|-- install.ps1         # idempotent installer for the profile
|-- package.json        # dsh.client + dsh.bundle.patch declarations
|-- README.md
`-- LICENSE
```

## Publishing

### npm

```powershell
npm login
npm pack          # produce the .tgz (verify the contents)
npm publish
git tag v1.0.0
```

### GitHub

```powershell
git remote add origin https://github.com/liell/dsh-workspace-explorer-picker.git
git push -u origin main
```

## License

MIT - see [LICENSE](LICENSE).
