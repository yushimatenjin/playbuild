import { Panel, SelectInput, Container, Element, Label } from '@playcanvas/pcui'

export default class PackagePanel extends Container {
    constructor(module, version){
        super({ flex: true, flexDirection: 'row', alignItems: 'center', class: 'pcui-pcpm-package' })

        const { name, versions, description, homepage } = module
        const options = Object.keys(versions).map(v => ({ t: v, v}))
        const title = new Label({ text: name, class: 'pcui-label' })
        const help = new Container({ class: 'help-icon'})
        const combo = new SelectInput({
            width: '7rem',
            defaultValue: version,
            options,
        })
        const remove = new Container({ class: 'remove-icon' })
        
        title.flexGrow = 1
        title.style.fontSize = '12px'
        combo.on('change', version => this.emit('change', { [name]: version }))

        remove.on('click', _ => this.emit('click:remove'));
        help.on('click', _ => window.open(`https://npmjs.com/pacakge/${name}`));

        this.append(title);
        if(homepage) this.append(help);
        this.append(combo);
        this.append(remove);

    }
}