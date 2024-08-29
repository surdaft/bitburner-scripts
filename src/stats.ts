import { NS, Server } from '@ns'
import { deepScanFlat } from '/server_list'

export async function main(ns: NS): Promise<void> {
    let serverList = deepScanFlat(ns, "home")
    ns.disableLog("sleep")

    let widest = 0
    serverList.forEach((h: Server) => {
        if (h.hostname.length > widest) {
            widest = h.hostname.length
        }
    })

    while (true) {
        serverList = deepScanFlat(ns, "home")
        const arr: Array<Server> = []

        serverList.forEach(h => {
            if (h.purchasedByPlayer || !h.hasAdminRights) {
                return
            }

            arr.push(h)
        })

        ns.clearLog()
        ns.print("hostname".padEnd(widest, " "), " | security        | money         ")

        arr.sort((a: Server, b: Server) => {
            return (b.moneyMax || 0) - (a.moneyMax || 0)
        })

        arr.slice(0, 20).forEach((h: Server) => {
            const difficulty = (h.minDifficulty || 1) / (h.hackDifficulty || 2)
            const growth = (h.moneyAvailable || 1) / (h.moneyMax || 1)

            ns.print(
                h.hostname.padEnd(widest, " "), " | ",
                ns.formatNumber(h.hackDifficulty || 0).toString().concat(" (", ns.formatPercent(difficulty, 2), ")").padEnd(15, " "), " | ",
                ns.formatNumber(h.moneyAvailable || 0).concat(" (", ns.formatPercent(growth, 2), ")").padEnd(14, " "))
        })

        await ns.sleep(1000)
    }
}