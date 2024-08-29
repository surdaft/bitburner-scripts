import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    const hn = ns.purchaseServer(ns.args[0].toString(), parseInt(ns.args[1].toString()))
    if (hn === "") {
        ns.tprint("ERROR: ", "failed to buy server")
    } else {
        ns.tprint("SUCCESS: ", "server created: ", ns.args[0])
    }
}