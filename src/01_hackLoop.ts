import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    const host = ns.args[0]
    if (!host) {
        ns.print("ERROR", " Arg 1 must be target host")
        return
    }

    let hostInfo = ns.getServer(host.toString())
    if (!hostInfo) {
        ns.print("ERROR", " host does not exist: ", host.toString())
        return
    }

    while (true) {
        hostInfo = ns.getServer(host.toString())
        const difficulty = (hostInfo.minDifficulty || 1) / (hostInfo.hackDifficulty || 2)
        const growth = (hostInfo.moneyAvailable || 0) / (hostInfo.moneyMax || 0)

        ns.print("INFO", " [loop] ", "min: ", hostInfo.minDifficulty || 'NaN')
        ns.print("INFO", " [loop] ", "current: ", hostInfo.hackDifficulty || 'NaN')
        ns.print("INFO", " [loop] ", "current percentage: ", ns.formatPercent(difficulty, 2))

        ns.print("INFO", " [loop] ", "available: ", hostInfo.moneyAvailable || 'NaN')
        ns.print("INFO", " [loop] ", "max: ", hostInfo.moneyMax || 'NaN')
        ns.print("INFO", " [loop] ", "percentage of available: ", ns.formatPercent(growth, 2))

        // if security is >= 20% more than minimum then reduce difficulty
        if (difficulty <= 0.8) {
            await ns.weaken(hostInfo.hostname)
            continue
        }

        // atleast 40% of total money available, we don't need it 100% for growth,
        // we will never blast it hard enough
        if (growth <= 0.4) {
            await ns.grow(hostInfo.hostname)
            continue
        }

        await ns.hack(hostInfo.hostname)
    }
}