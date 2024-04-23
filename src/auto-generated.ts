
const runTimeDependencies = {
    "externals": {
        "@youwol/mkdocs-ts": "^0.3.1",
        "@youwol/rx-vdom": "^1.0.1",
        "bootstrap": "^4.4.1",
        "@youwol/webpm-client": "^3.0.0",
        "@youwol/http-clients": "^3.0.0",
        "@youwol/http-primitives": "^0.2.3",
        "@youwol/local-youwol-client": "^0.2.12",
        "@youwol/os-core": "^0.2.0",
        "@youwol/os-widgets": "^0.2.6",
        "@youwol/rx-tree-views": "^0.3.1",
        "@youwol/rx-code-mirror-editors": "0.5.0",
        "@floating-ui/dom": "^1.6.3",
        "rxjs": "^7.5.6",
        "d3": "^7.7.0"
    },
    "includedInBundle": {
        "d3-dag": "0.8.2"
    }
}
const externals = {
    "@youwol/mkdocs-ts": "window['@youwol/mkdocs-ts_APIv03']",
    "@youwol/rx-vdom": "window['@youwol/rx-vdom_APIv1']",
    "bootstrap": "window['bootstrap_APIv4']",
    "@youwol/webpm-client": "window['@youwol/webpm-client_APIv3']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv3']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv02']",
    "@youwol/local-youwol-client": "window['@youwol/local-youwol-client_APIv02']",
    "@youwol/os-core": "window['@youwol/os-core_APIv02']",
    "@youwol/os-widgets": "window['@youwol/os-widgets_APIv02']",
    "@youwol/rx-tree-views": "window['@youwol/rx-tree-views_APIv03']",
    "@youwol/rx-code-mirror-editors": "window['@youwol/rx-code-mirror-editors_APIv05']",
    "@floating-ui/dom": "window['@floating-ui/dom_APIv1']",
    "rxjs": "window['rxjs_APIv7']",
    "d3": "window['d3_APIv7']",
    "@youwol/local-youwol-client/src/lib/routers/environment/interfaces": "window['@youwol/local-youwol-client_APIv02']['src']['lib']['routers']['environment']['interfaces']",
    "@youwol/local-youwol-client/src/lib/interfaces": "window['@youwol/local-youwol-client_APIv02']['src']['lib']['interfaces']",
    "rxjs/operators": "window['rxjs_APIv7']['operators']"
}
const exportedSymbols = {
    "@youwol/mkdocs-ts": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/mkdocs-ts"
    },
    "@youwol/rx-vdom": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/rx-vdom"
    },
    "bootstrap": {
        "apiKey": "4",
        "exportedSymbol": "bootstrap"
    },
    "@youwol/webpm-client": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/webpm-client"
    },
    "@youwol/http-clients": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/local-youwol-client": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/local-youwol-client"
    },
    "@youwol/os-core": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-core"
    },
    "@youwol/os-widgets": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-widgets"
    },
    "@youwol/rx-tree-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tree-views"
    },
    "@youwol/rx-code-mirror-editors": {
        "apiKey": "05",
        "exportedSymbol": "@youwol/rx-code-mirror-editors"
    },
    "@floating-ui/dom": {
        "apiKey": "1",
        "exportedSymbol": "@floating-ui/dom"
    },
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    },
    "d3": {
        "apiKey": "7",
        "exportedSymbol": "d3"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./main.ts",
    "loadDependencies": [
        "@youwol/mkdocs-ts",
        "@youwol/rx-vdom",
        "bootstrap",
        "@youwol/webpm-client",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/local-youwol-client",
        "@youwol/os-core",
        "@youwol/os-widgets",
        "@youwol/rx-tree-views",
        "@youwol/rx-code-mirror-editors",
        "@floating-ui/dom",
        "rxjs",
        "d3"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/co-lab': './main.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/co-lab/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/co-lab',
        assetId:'QHlvdXdvbC9jby1sYWI=',
    version:'0.3.6-wip',
    shortDescription:"The YouWol's collaborative laboratory application.",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/co-lab&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/co-lab',
    sourceGithub:'https://github.com/youwol/co-lab',
    userGuide:'https://l.youwol.com/doc/@youwol/co-lab',
    apiVersion:'03',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/co-lab_APIv03`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/co-lab#0.3.6-wip~dist/@youwol/co-lab/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/co-lab/${entry.name}_APIv03`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
