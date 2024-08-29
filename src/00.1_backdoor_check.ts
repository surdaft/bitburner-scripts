import { NS, Server } from '@ns'

export async function main(ns: NS): Promise<void> {
    let hostInfo = getHost(ns)

    try {
        ns.brutessh(hostInfo.hostname)
        ns.ftpcrack(hostInfo.hostname)
        ns.relaysmtp(hostInfo.hostname)
        ns.httpworm(hostInfo.hostname)
        ns.sqlinject(hostInfo.hostname)
    } catch (e) {
        // ns.tprint("ERROR: ", e)
    }

    // refresh
    hostInfo = getHost(ns)

    // check if we have enough ports to nuke
    if ((hostInfo.numOpenPortsRequired || 0) > (hostInfo.openPortCount || 0)) {
        return
    }

    // check if already nuked
    if (hostInfo.hasAdminRights) {
        return
    }

    ns.nuke(hostInfo.hostname)
    if (ns.hasRootAccess(hostInfo.hostname)) {
        ns.tprint("SUCCESS: ", "access granted to ", hostInfo.hostname)
    } else {
        ns.tprint("ERROR: ", "access not granted to ", hostInfo.hostname)
    }
}

function getHost(ns: NS): Server {
    if (ns.args.length === 1) {
        return ns.getServer(ns.args[0].toString())
    } else {
        return ns.getServer()
    }
}