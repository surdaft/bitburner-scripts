import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    const host = ns.args[0].toString()
    if (!host) {
        ns.tprint("ERROR", " Arg 1 must be target host")
        return
    }

    const newRam = parseInt(ns.args[1].toString())
    if (!newRam) {
        ns.tprint("ERROR", " need to provide new ram")
        return
    }

    ns.tprint("INFO", " upgrade cost: ", ns.formatNumber(ns.getPurchasedServerUpgradeCost(host, newRam), 2))
    if (!ns.upgradePurchasedServer(host, newRam)) {
        ns.tprint("ERROR", " could not upgrade server")
    }
}