
export default class PackagePanel extends pcui.Container {
    constructor(module, version){
        super({ flex: true, flexDirection: 'row', alignItems: 'center', class: 'pcui-pcpm-package' })

        const { name, versions } = module
        const options = Object.keys(versions).map(v => ({ t: v, v}))
        const title = new pcui.Label({ text: name, class: 'pcui-label' })
        const help = new pcui.Container({ class: 'help-icon'})
        const combo = new pcui.SelectInput({
            width: '7rem',
            defaultValue: version,
            options,
        })
        const remove = new pcui.Container({ class: 'remove-icon' })
        
        title.flexGrow = 1
        title.style.fontSize = '12px'
        combo.on('change', version => this.emit('change', { [name]: version }))

        remove.on('click', _ => this.emit('click:remove'))
        help.on('click', _ => window.open(`https://npmjs.com/package/${name}`))

        this.append(title)
        this.append(help)
        this.append(combo)
        this.append(remove)

    }
}