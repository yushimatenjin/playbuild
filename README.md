<div >
  <br>
  <img display='inline' src="./static/icon.png" alt="PlayBuild" width="100">
  <h1 display='inline'  >PlayBuild</h1>
  <h3>A bundler and Package Manager for PlayCanvas</h3>
  <h4><a href='https://github.com/marklundin/pcpm/wiki/Getting-Started'>Getting Started</a></h4>
</div
  
PlayBuild is a in-editor compiler, bundler and package manager for the PlayCanvas editor that adds support for Javascript Modules, TypeScript JSX and all the usual features of modern web tooling. 

```javascript
// Import code from other scripts
import config from './config'

// import npm libs
import { firebaseApp } from 'firebase/app'
import React from 'react'

var MyScript = pc.createScript('myScript')

// initialize code called once per entity
MyScript.prototype.initialize = function() {

    // Import your own modules
    const key = config.firebaseKey

    // Use NPM modules
    const app = firebaseApp(key)
}
```


When you're creating games in PlayCanvas you'll often find yourself wanting to structure your code in a better way, seperating out utilities and config files, res-usable classes, or simply to import some code from a 3rd party libray. Whilst there are a few ways to achieve this they often feel like a workaround that don't quite line up with modern javsacript tooling. PlayBuild allows you to use js modules and npm libraries in your PlayCanvas projects, it supports all the usual features such as de-duping, minification and dead code removal and more. It also has preliminary support for JSX and TypeScript.

### How does this all work?
PlayBuild is a compiler built around [ESBuild](https://github.com/evanw/esbuild) that syncs with your project and compiles and bundles your code. Your asset registry is treated as a regular file system so local modules can be resolved and remote modules can be imported. There is no run-time dependancy on external CDN's.

