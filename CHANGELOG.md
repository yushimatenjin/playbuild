# Changelog

## 0.0.4

Fixed a few bugs for specific edge cases such as having no scripts in the project but PlayBuild is enabled. Also enabled the tsx compiler for all plugins.

Updated esbuild + wasm bundler.

## 0.0.3

PCPM has now been rebranded as PlayBuild, which is a little easier to use. Most references have been updated, but there still exist a few legacy instances that refer to older pcpm package.

* **UI updates**

	The UI for installed external packages has been updated. You can now set the package version via the UI now rather than having to manually edit the `package.json`

* **Removed PCUI + Observer from the build**

	PlayBuild now uses the in-editor version of PCUI. The dependancy on pcui has now been removed from the build as it's already provided by the editor. This may have caused hard to debug issues with having two version of the library especially if versions became out of sync.

* **Compiler options**

	You can now specific compiler options using a `playbuild` field in the `package.json`. This allows you to control the behaviour of the compiler by enabling minification or other features. These are a subset of the options available in [esbuild](https://esbuild.github.io/api/#optimization)

	```javascript
	{
		dependencies: {},
		playbuild: {
			define: { DEBUG : 'true' }
			drop : ['console', 'debugger']
			keepNames: true,
			mangleProps: true,
			minify: true,
			treeShaking: true
		}
	}
	```

## 0.0.2

* **UI Improvements**
	  
	Overhaul of the UI to provide better feedback when the compiler is running for the project and when it's not. This also includes a CTA in the ui to enable the compiler by creating a `package.json` file.

* **Upgraded the esbuild wasm compiler**

* **Improved stability for file watching**

	There were a number of issues watching the `package.json` in the root of the registry which led to situations where the compiler was not correctly initialised when it should have been or vice-versa. This has now been improved and should be more stable across projects with multiple users working concurrently.

* **Compiler/Bundler now works with typescript and jsx**

  Typecript and JSX has now been enabled by default in the compiler, so it will correctly bundle these files. However there the PC Monaco editor is not linting some of these files correctly which defeats much of the need for typescript. If/when the editor can be updated though, this should automatically translate without any code changes needed to pcpm

## 0.0.1

Initial release.
