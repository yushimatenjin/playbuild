import { createPackageJson } from '../../utils/package'

export default class NoPackageJson extends pcui.Container {

    constructor(){
        super()
        this.dom.style.margin = '6px'
        this.dom.style.padding = '12px'
        this.dom.style.border = '1px solid #293538'
        this.dom.style['border-radius'] = '2px'
        this.dom.style['background-color'] = '#2c393c'

        const noPackageErrorPanel = new pcui.InfoBox({
            icon: 'E410',
            title: 'Modules Disabled',
            unsafe: true,
            text: "To use playcanvas modules you must create a <span class='font-bold'>package.json</span> in the root of your project. Add one by clicking the button below.<br><br><a href='https://github.com/marklundin/pcpm#getting-startedd' target='_blank'>Learn more</a> about PlayCanvas modules.",
        })
        
        noPackageErrorPanel.dom.style.border = 'none'
        noPackageErrorPanel.dom.style.padding = '0'
        noPackageErrorPanel.dom.style['padding-bottom'] = '3px'

        const addPackageJsonBtn = new pcui.Button({
            icon: 'E120',
            text: 'Enable Modules'
        })

        addPackageJsonBtn.dom.style['margin-left'] = '2rem'

        addPackageJsonBtn.on('click', async _ => {
            addPackageJsonBtn.enabled = false
            const pkg = await createPackageJson()
            this.emit('package:created', pkg)
            addPackageJsonBtn.enabled = true
        })
        
        this.append(noPackageErrorPanel)
        this.append(addPackageJsonBtn)
    }
} 