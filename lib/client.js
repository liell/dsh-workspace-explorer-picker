window.__ModuleLoader__.load({
	id: "dsh-workspace-explorer-picker",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		/**
		 * Renderless flow occupant: each rising `open` edge runs exactly one pick and
		 * reports exactly one outcome; the ref arms once per open so re-renders (and
		 * an adoption keeping `open` true while `busy`) never launch a second
		 * chooser. The owner withdrawing `open` re-arms the next request.
		 *
		 * The chooser renders on the host display: inside DeepSeek Harness Desktop
		 * it is the shell's native Windows Explorer folder dialog (Electron
		 * dialog.showOpenDialog); outside the desktop shell it falls back to the
		 * host directory-picker seam.
		 */
		function ExplorerDirectoryFlow(props) {
			const { open, pick } = props;
			const armed = (0, react.useRef)(false);
			const outcome = (0, react.useRef)(props);
			outcome.current = props;
			const alive = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				alive.current = true;
				return () => {
					alive.current = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				if (!open) {
					armed.current = false;
					return;
				}
				if (armed.current) return;
				armed.current = true;
				pick().then((path) => {
					if (!alive.current) return;
					if (path === null) outcome.current.onCancel();
					else outcome.current.onPicked(path);
				}, (reason) => {
					if (!alive.current) return;
					outcome.current.onError(reason instanceof Error ? reason.message : String(reason));
				});
			}, [open, pick]);
			return null;
		}
		/** Required services (cordis fiber inject): the slot registry and the wire-facing workspace service. */
		const inject = ["slots", "workspaces"];
		/**
		 * Client plugin body: register the renderless flow into both directory-flow
		 * holes through `slots.inject()` because the ui-workspace entries may
		 * activate later or replace their declarations.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			const injected = () => ({
				pick: () => {
					// DeepSeek Harness Desktop shell bridge: the Windows Explorer folder dialog.
					const desktopPick = window.__DSH_DESKTOP_PICK_DIRECTORY__;
					if (typeof desktopPick === "function") return desktopPick();
					// Fallback: the host directory-picker seam (native/browse backend).
					return ctx.workspaces.pickDirectory();
				}
			});
			ctx.slots.inject("conversation.hero.workspace.directoryFlow", () => ctx.slots.inject("sidebar.workspaces.directoryFlow", function* () {
				yield ctx.slots.register({
					name: "conversation.hero.workspace.directoryFlow",
					inject: injected
				}, ExplorerDirectoryFlow);
				yield ctx.slots.register({
					name: "sidebar.workspaces.directoryFlow",
					inject: injected
				}, ExplorerDirectoryFlow);
			}));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
