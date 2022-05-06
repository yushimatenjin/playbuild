import { SourceMapConsumer } from 'source-map'

const injectOnError = async _ => {

    const script = Array.from(document.querySelectorAll('script')).find(script => script.src.includes('.pcpm/'))
    
    if(script){

        SourceMapConsumer.initialize({
            "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm"
        });

        const pragma = '//# sourceMappingURL=data:application/json;base64,'
        const code = await fetch(script.src).then(r => r.text())
        const b64 = code.slice(code.indexOf(pragma) + pragma.length)
        const sourceMap = JSON.parse(window.atob(b64))
        
        const consumer = await new SourceMapConsumer(sourceMap);

        const onPCError = window.onerror
        window.onerror  = function(msg, url, line, column, e){
            // check if originated from built.js
            if(url.indexOf('files/.pcpm/built.js') !== -1){
                const m = consumer.originalPositionFor({
                    line, 
                    column
                })
                onPCError(msg, m.source, m.line, m.column, e)
            } else {
                onPCError(msg, url, line, column, e)
            }
        }

        consumer.destroy();
    }
}

editor?.on('assets:load', _ => injectOnError())
