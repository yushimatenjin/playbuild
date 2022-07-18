// import { SourceMapConsumer } from 'source-map'
import StackTrace from 'stacktrace-js'

const injectOnError = _ => {

    // SourceMapConsumer.initialize({
    //     "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm"
    // });
    
    const onAssetAdded = async asset => {
    
        if(asset.get('file.url')?.includes('.pcpm/built.js')){

            pc.app.off('assets:add', onAssetAdded)

            // console.log('load', buildAsset.file.url)


            const pragma = '//# sourceMappingURL=data:application/json;base64,'
            const code = await fetch('/api/' + asset.get('file.url')).then(r => r.text())
            const b64 = code.slice(code.indexOf(pragma) + pragma.length)
            const sourceMap = JSON.parse(window.atob(b64))
            
            // const consumer = await new SourceMapConsumer(sourceMap);

            const consoleError = console.error
            console.error = function(...args){

                console.log(args)

                const sourceMapped = args.map(async item => {
                    if(item instanceof Error && item.stack){
                        const line = item.stack.split('\n')?.[1]
                        const url = line.slice(line.indexOf('(') + 1)
                        const frames = await StackTrace.fromError(item)
                        const frame = frames[0]
                        //parseInt(url.match(/\/api\/assets\/files\/.+?id=([0-9]+)/)[1], 10)
                        // const { functionName } = await gps.pinpoint(frame)
                        const strError = frames.map(sf => `at ` + sf.toString()).join('\n');
                        console.log(frame.fileName)
       
                        // console.log(strError);
                        item.stack = item.message + '\n    ' + strError
                        consoleError(item)

                        // consoleError(item)

                        // const msg = item.message;
                        // const lines = item.stack.split('\n');
                        // if (lines.length >= 2) {
                        //     const line = lines[1];
                        //     let url = line.slice(line.indexOf('(') + 1);
                        //     const m = url.match(/:[0-9]+:[0-9]+\)/);
                        //     if (m) {
                        //         url = url.slice(0, m.index);
                        //         var parts = m[0].slice(1, -1).split(':');
        
                        //         if (parts.length === 2) {
                        //             var lineNumber = parseInt(parts[0], 10);
                        //             var colNumber = parseInt(parts[1], 10);

                        //             const mapping = consumer.originalPositionFor({
                        //                 line: lineNumber,
                        //                 column: colNumber
                        //             })
        
                        //             console.log(msg, url, lineNumber, colNumber, mapping)
                                    
                        //             // onError(msg, url, lineNumber, colNumber, item);
                        //             // errorPassed = true;
                        //         }
                        //     }
                        // }
                    }
                })

            }
            // consumer.destroy();
        }
    }

    editor.on('assets:add', onAssetAdded)
}

injectOnError()
