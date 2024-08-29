import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    if (ns.args.length !== 2) {
        ns.tprint("INFO: usage `run buy_server.js <name> <size>`")
        return
    }

    const name = ns.args[0].toString()
    const ram = parseInt(ns.args[1].toString())
    const cost = ns.getPurchasedServerCost(ram)

    if (ns.getPlayer().money < cost) {
        ns.tprint("ERROR: ", "you're too skint! You need $", ns.formatNumber(cost, 2))
        return
    }

    if (!await ns.prompt("Are you sure? It will cost $" + ns.formatNumber(cost, 2), { type: "boolean" })) {
        return
    }

    const hn = ns.purchaseServer(name, ram)
    if (hn === "") {
        ns.tprint("ERROR: ", "failed to buy server")
    } else {
        ns.tprint("SUCCESS: ", "server created: ", hn)
    }
}