
export default unpkgPathPlugin = (p) => {

    let packages = p
    const updatePackages = p => (packages = p)
    const filter = /^[^\.\/]/

    return {
        plugin: {
            name: 'unpkg-path-plugin',
            setup(build) {

                build.onResolve({ filter }, (args) => {

                    const version = packages[args.path]

                    if(!version) return { errors: [{
                        text: `Module '${args.path}' was not found. Are you sure it was installed?`
                        // location: Location | null;
                        // detail: any; // The original error from a JavaScript plugin, if applicable
                    }]}

                    return { path: new URL(args.path + "@" + version, "https://unpkg.com/").href, namespace: 'module' };
                });

                build.onLoad({ filter, namespace: 'module' }, async (args) => {
                    const contents = await fetch(args.path).then(resp => resp.arrayBuffer())
                    return {
                        loader: "js",
                        contents: new Uint8Array(contents),
                    };
                });
            }
        }
    }
};
  