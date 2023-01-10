import { createPackageJson } from '../../utils/package'

export default class NoPackageJson extends pcui.Container {

    constructor(){
        super()

        this.class.add('pcui-infobox');

        const noPackageErrorPanel = new pcui.InfoBox({
            icon: 'E410',
            title: 'Modules Disabled',
            text: 'A valid package.json must be included at the root of the asset registry'
        })
        // noPackageErrorPanel.class.remove('pcui-infobox');

        const addPackageJsonBtn = new pcui.Button({
            // icon: 'E120',
            text: 'Create package.json'
        })

        

        addPackageJsonBtn.on('click', async _ => {
            addPackageJsonBtn.enabled = false
            const pkg = await createPackageJson()
            this.emit('package:created', pkg)
            addPackageJsonBtn.enabled = true
        })

        noPackageErrorPanel.flex = true
        noPackageErrorPanel.flexDirection = 'column'
        // noPackageErrorPanel.error = true

        this.append(noPackageErrorPanel)
        this.append(addPackageJsonBtn)
    }
} 