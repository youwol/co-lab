
const runTimeDependencies = {
    "externals": {
        "@youwol/mkdocs-ts": "^0.1.2",
        "@youwol/rx-vdom": "^1.0.1",
        "@youwol/webpm-client": "^3.0.0",
        "@youwol/http-clients": "^3.0.0",
        "@youwol/http-primitives": "^0.2.2",
        "@youwol/local-youwol-client": "^0.2.2",
        "@youwol/os-widgets": "^0.2.2",
        "@youwol/rx-code-mirror-editors": "0.5.0",
        "rxjs": "^7.5.6",
        "d3": "^7.7.0"
    },
    "includedInBundle": {
        "d3-dag": "0.8.2"
    }
}
const externals = {
    "@youwol/mkdocs-ts": "window['@youwol/mkdocs-ts_APIv01']",
    "@youwol/rx-vdom": "window['@youwol/rx-vdom_APIv1']",
    "@youwol/webpm-client": "window['@youwol/webpm-client_APIv3']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv3']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv02']",
    "@youwol/local-youwol-client": "window['@youwol/local-youwol-client_APIv02']",
    "@youwol/os-widgets": "window['@youwol/os-widgets_APIv02']",
    "@youwol/rx-code-mirror-editors": "window['@youwol/rx-code-mirror-editors_APIv05']",
    "rxjs": "window['rxjs_APIv7']",
    "d3": "window['d3_APIv7']",
    "rxjs/operators": "window['rxjs_APIv7']['operators']"
}
const exportedSymbols = {
    "@youwol/mkdocs-ts": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/mkdocs-ts"
    },
    "@youwol/rx-vdom": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/rx-vdom"
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
    "@youwol/os-widgets": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-widgets"
    },
    "@youwol/rx-code-mirror-editors": {
        "apiKey": "05",
        "exportedSymbol": "@youwol/rx-code-mirror-editors"
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
        "@youwol/webpm-client",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/local-youwol-client",
        "@youwol/os-widgets",
        "@youwol/rx-code-mirror-editors",
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
    version:'0.1.0',
    shortDescription:"The YouWol's collaborative laboratory application.",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/co-lab&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/co-lab',
    sourceGithub:'https://github.com/youwol/co-lab',
    userGuide:'https://l.youwol.com/doc/@youwol/co-lab',
    apiVersion:'01',
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
            return window[`@youwol/co-lab_APIv01`]
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
            `@youwol/co-lab#0.1.0~dist/@youwol/co-lab/${entry.name}.js`
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
            return window[`@youwol/co-lab/${entry.name}_APIv01`]
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
