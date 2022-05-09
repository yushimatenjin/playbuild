import { createPackageJson } from '../utils/package'

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