const createPackageJson = _ => {
    return new Promise((resolve, reject) => {
        if (! editor.call('permissions:write')) return

        // args = args || { };

        var asset = {
            name: 'package.json',
            type: 'json',
            source: false,
            // parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            filename: 'package.json',
            file: new Blob([JSON.stringify({dependencies:{}}, null, 4)], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        const onDone = r => {
            resolve()
        }

        editor.call('assets:create', asset, onDone, true);
    })
}

export default class NoPackageJson extends pcui.Container {

    constructor(){
        super(arguments)

        const noPackageErrorPanel = new pcui.InfoBox({
            icon: 'E218',
            title: 'No Package.json found',
            text: 'A valid package.json must be included at the root of the asset registry'
        })

        const addPackageJsonBtn = new pcui.Button({
            icon: 'E120',
            text: 'Add package.json'
        })

        addPackageJsonBtn.on('click', async _ => {
            addPackageJsonBtn.enabled = false
            const pkg = await createPackageJson()
            this.emit('package:created', pkg)
            addPackageJsonBtn.enabled = true
        })

        noPackageErrorPanel.flex = true
        noPackageErrorPanel.error = true

        this.append(noPackageErrorPanel)
        this.append(addPackageJsonBtn)
    }
} 