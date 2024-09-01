import { NS, Server, ProcessInfo } from '@ns'
import { ExtendedServer, deepScanFlat } from '/server_list'
import { convertMiliseconds } from '/util'

export async function main(ns: NS): Promise<void> {
    let serverList = deepScanFlat(ns, "home")
    ns.disableLog("sleep")

    let widest = 0
    serverList.forEach((h: Server) => {
        if (h.hostname.length > widest) {
            widest = h.hostname.length
        }
    })

    ns.tail()
    ns.resizeTail(960, 500)
    ns.setTitle("Server Stats")

    while (true) {
        serverList = deepScanFlat(ns, "home")
        const arr: Array<ExtendedServer> = []

        serverList.forEach(h => {
            if (h.purchasedByPlayer || !h.hasAdminRights || (h.moneyAvailable || 0) === 0) {
                return
            }

            arr.push(h)
        })

        ns.clearLog()

        const headings = [
            " " + "hostname".padEnd(20, " "),
            "security".padEnd(20, " "),
            "money".padEnd(20, " "),
            "status".padEnd(30, " "),
        ];

        ns.print(headings.join(" | "))
        ns.print("".padEnd((headings.length * 20) + 19, "-"))

        arr.sort((a: Server, b: Server) => {
            return (b.moneyMax || 0) - (a.moneyMax || 0)
        })

        const now = (new Date).getTime()
        arr.filter((s: Server) => {
            return s.moneyAvailable
        }).forEach((h: Server) => {
            const difficulty = (h.minDifficulty || 1) / (h.hackDifficulty || 2)
            const growth = (h.moneyAvailable || 1) / (h.moneyMax || 1)

            let status = "-"
            const procFile = "proc/" + h.hostname + ".json"
            if (ns.fileExists(procFile)) {
                try {
                    const proc = JSON.parse(ns.read(procFile))
                    if (proc) {
                        if (!ns.isRunning(proc.pid)) {
                            ns.rm(procFile)
                        } else {
                            status = proc.status
                            const remainingMs = proc.duration - (now - parseInt(proc.ts))
                            status = status.padEnd(17, " ").concat(convertMiliseconds(remainingMs).padStart(11, " "))
                        }
                    }
                } catch (e) {
                    status = "error"
                }
            }

            ns.print([
                " " + h.hostname.padEnd(20, " "),
                ns.formatNumber(h.hackDifficulty || 0, 3).padEnd(10, " ").concat(ns.formatPercent(difficulty, 2).padStart(10)).padEnd(20, " "),
                ns.formatNumber(h.moneyAvailable || 0, 3).padEnd(10, " ").concat(ns.formatPercent(growth, 2).padStart(10)).padEnd(20, " "),
                status.padEnd(30, " ")
            ].join(" | "))
        })

        await ns.sleep(1000)
    }
}