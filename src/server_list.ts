import { NS, Server } from '@ns'

export type ExtendedServer = Server & { parent?: Server }

/**
 * List servers, ordered by max money accessible
 * @param ns
 */
export async function main(ns: NS): Promise<void> {
    const hostList = deepScanFlat(ns, "home")

    const arr: Array<ExtendedServer> = []
    hostList.forEach(v => {
        if (v.hasAdminRights && !v.purchasedByPlayer) {
            arr.push(v)
        }
    })

    // a map cannot be sorted
    arr.sort((a: ExtendedServer, b: ExtendedServer) => {
        return (b.moneyMax || 0) - (a.moneyMax || 0)
    })

    let widest = 0
    arr.forEach((h: ExtendedServer) => {
        if (h.hostname.length > widest) {
            widest = h.hostname.length
        }
    })

    arr.forEach((h: ExtendedServer) => {
        ns.tprint(h.hostname.padEnd(widest, " "), " | ", ns.formatNumber(h.moneyMax || 0))
    })
}

/**
 * @param ns
 * @param host
 * @returns Tree
 */
export function deepScan(ns: NS, host: string): Tree {
    return _deepScan(ns, host, newFlatTree(), newTree(), undefined).hostTree
}

/**
 * @param ns
 * @param host
 * @returns Tree
 */
export function deepScanTree(ns: NS, host: string): Tree {
    return _deepScan(ns, host, newFlatTree(), newTree(), undefined).hostTree
}

/**
 * @param ns
 * @param host
 * @returns Tree
 */
export function deepScanFlat(ns: NS, host: string): FlatTree {
    return _deepScan(ns, host, newFlatTree(), newTree(), undefined).foundHosts
}

export type Tree = Map<string, Tree>
export type FlatTree = Map<string, ExtendedServer>

function newTree(): Tree {
    return new Map<string, Tree>()
}

function newFlatTree(): FlatTree {
    return new Map<string, ExtendedServer>()
}

function _deepScan(ns: NS, host: string, foundHosts: FlatTree, hostTree: Tree, parent?: ExtendedServer): any {
    const hostInfo = ns.getServer(host) as ExtendedServer
    hostInfo.parent = parent

    foundHosts.set(host, hostInfo)

    if (!hostTree.has(host)) {
        hostTree.set(host, newTree())
    }

    const hosts = ns.scan(host).filter(v => {
        return !foundHosts.has(v)
    })

    if (!hosts) {
        return { foundHosts, hosts, hostTree }
    }

    const currTree = hostTree.get(host)
    if (!currTree || currTree === undefined) {
        return { foundHosts, hosts, hostTree }
    }

    for (const i of hosts) {
        const _scan = _deepScan(ns, i, foundHosts, currTree, hostInfo)

        hostTree.set(host, _scan.hostTree)
    }

    return { foundHosts, hosts, hostTree }
}