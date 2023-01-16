# Changelog

## 0.0.3

The UI for installed packages has been updated so that you can now see the current installed package version aswell as changing it to any other release.

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
