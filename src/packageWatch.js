// editor.on('load'), _ => {

const watchPkgJson = onChange => {}

    const packageJson = findAsset(isPkgJson)

    const watch = pkg => {
        watchFile(pkg)
        pkg.on('remove', _ => onChange(null))
    }

    if(packageJson) watchFile(packageJson, onChange)
    else {
        editor.on('asset:add', asset => {
            if(isPkgJson(asset)) watchFile(packageJson, onChange)
        })
    }
}