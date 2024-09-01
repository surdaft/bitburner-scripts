import { NS } from '@ns'
import { deepScanFlat, ExtendedServer } from '/server_list'

export async function main(ns: NS): Promise<void> {
    const input = ns.flags([
        ["host", ""]
    ])

    const host = input.host.toString()
    if (host === "") {
        return
    }

    const serverList = deepScanFlat(ns, "home")
    if (!serverList.has(host)) {
        return
    }

    let lastHost = serverList.get(host)
    if (lastHost === undefined) {
        return
    }

    const path = []
    while (lastHost !== undefined && lastHost.parent !== null) {
        const h: ExtendedServer = lastHost
        path.push(h)
        if (h.parent === null) {
            break
        }

        lastHost = h.parent
    }

    ns.tprint(path.map(function (h: ExtendedServer): string {
        return h.hostname
    }).join(" -> "))
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
    return [...data.servers]
}