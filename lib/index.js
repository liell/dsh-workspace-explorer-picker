/**
 * dsh-workspace-explorer-picker - host half.
 *
 * DeepSeek Harness Desktop plugin. Pure UI plugin: the empty apply exists so
 * the plugin appears in the host cordis.yml / Loader; the browser half ships
 * via exports["./client"], discovered through the package.json dsh.client
 * declaration.
 *
 * The OS chooser is the DSH Desktop shell's own native picker (Electron
 * dialog.showOpenDialog - the Windows Explorer folder dialog), with the host
 * directory-picker seam as fallback.
 */
function apply() {}
export { apply };
