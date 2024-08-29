import { NS, Server } from '@ns'

const baseCost = 1.75
let home: Server

export async function main(ns: NS): Promise<void> {
    // get the host information
    const node = ns.args[0].toString()
    const host = ns.args[1].toString()
    if (!host) {
        ns.print("ERROR", " Arg 1 must be target host")
        return
    }

    ns.scp([
        "weaken.js",
        "grow.js",
        "hack.js"
    ], node, "home")

    ns.tail()

    while (true) {
        const hostInfo = ns.getServer(host)
        if (!hostInfo) {
            ns.print("ERROR", " host does not exist: ", host.toString())
            return
        }

        if (hostInfo.purchasedByPlayer || hostInfo.organizationName === "home") {
            return
        }

        home = ns.getServer(node)
        ns.print(home)

        await checkWeaken(ns, hostInfo)
        await checkGrowth(ns, hostInfo)
        await hackServer(ns, hostInfo)

        await ns.sleep(100)
    }
}

async function checkWeaken(ns: NS, hostInfo: Server) {
    if (hostInfo.hackDifficulty === hostInfo.minDifficulty) {
        return
    }

    // calculate the required threads to fully weaken server
    const weakenEffect = ns.weakenAnalyze(1)
    let weakenThreads = Math.ceil(((hostInfo.hackDifficulty || 2) - (hostInfo.minDifficulty || 1)) / weakenEffect)
    const weakenTime = ns.getWeakenTime(hostInfo.hostname)

    const startingThreads = weakenThreads
    let weakenRamCost = baseCost * weakenThreads;
    for (; weakenRamCost > (home.maxRam - (home.ramUsed || 0)) && weakenThreads > 2; weakenThreads--) {
        // ns.print(
        //     "too much ram needed to weaken, ",
        //     ns.formatRam(home.maxRam - (home.ramUsed || 0)),
        //     " ram available ",
        //     ns.formatRam(weakenRamCost)
        // )

        weakenRamCost = baseCost * weakenThreads
    }

    if (startingThreads !== weakenThreads) {
        ns.tprint(home.hostname, " is underprovisioned. needed ", ns.formatRam(baseCost * startingThreads), ", actually used ", ns.formatRam(weakenRamCost))
    }

    // execute external command to weaken
    // ns.tprint(
    //     "it would take ",
    //     (weakenTime / 1000).toFixed(2),
    //     "s to weaken from ",
    //     hostInfo.hackDifficulty,
    //     " to ",
    //     hostInfo.minDifficulty,
    //     " using ",
    //     weakenThreads,
    //     " threads"
    // )

    if (ns.exec("weaken.js", home.hostname, weakenThreads, hostInfo.hostname)) {
        await ns.sleep(weakenTime + 100)
    }
}

async function checkGrowth(ns: NS, hostInfo: Server) {
    if (hostInfo.moneyAvailable === hostInfo.moneyMax) {
        return
    }

    // calculate the required threads to fully grow the server
    let growthThreads = hostInfo.moneyMax || 1
    const growthRequired = ((hostInfo.moneyAvailable || 1) / (hostInfo.moneyMax || 1)) * 100
    if (growthRequired > 1) {
        growthThreads = Math.ceil(ns.growthAnalyze(hostInfo.hostname, growthRequired))
    }

    const growthTime = ns.getGrowTime(hostInfo.hostname)

    const startingThreads = growthThreads
    let growthRamCost = baseCost * growthThreads;
    for (; growthRamCost > (home.maxRam - (home.ramUsed || 0)) && growthThreads > 2; growthThreads--) {
        // ns.print(
        //     "too much ram needed to grow, ",
        //     ns.formatRam(home.maxRam - (home.ramUsed || 0)),
        //     " ram available ",
        //     ns.formatRam(growthRamCost)
        // )

        growthRamCost = baseCost * growthThreads
    }

    if (startingThreads !== growthThreads) {
        ns.tprint(home.hostname, " is underprovisioned. needed ", ns.formatRam(baseCost * startingThreads), ", actually used ", ns.formatRam(growthRamCost))
    }

    // execute external command to grow
    // ns.tprint(
    //     "it would take ",
    //     (growthTime / 1000).toFixed(2),
    //     "s to grow from ",
    //     hostInfo.moneyAvailable,
    //     " to ",
    //     hostInfo.moneyMax,
    //     " using ",
    //     growthThreads,
    //     " threads"
    // )

    if (ns.exec("grow.js", home.hostname, growthThreads, hostInfo.hostname)) {
        await ns.sleep(growthTime + 100)
    }
}

async function hackServer(ns: NS, hostInfo: Server) {
    if ((hostInfo.moneyAvailable || 0) < (hostInfo.moneyMax || 0)) {
        return
    }

    let hackThreads = Math.ceil(ns.hackAnalyzeThreads(hostInfo.hostname, (hostInfo.moneyAvailable || 0) * 0.8))
    let hackRamCost = baseCost * hackThreads
    const hackTime = ns.getHackTime(hostInfo.hostname)

    const startingThreads = hackThreads
    for (; hackRamCost > (home.maxRam - (home.ramUsed || 0)) && hackThreads > 2; hackThreads--) {
        // ns.print(
        //     "too much ram needed to hack, ",
        //     ns.formatRam(home.maxRam - (home.ramUsed || 0)),
        //     " ram available ",
        //     ns.formatRam(hackRamCost)
        // )

        hackRamCost = baseCost * hackThreads
    }

    if (startingThreads !== hackThreads) {
        ns.tprint(home.hostname, " is underprovisioned. needed ", ns.formatRam(baseCost * startingThreads), ", actually used ", ns.formatRam(hackRamCost))
    }

    if (ns.exec("hack.js", home.hostname, hackThreads, hostInfo.hostname)) {
        await ns.sleep(hackTime + 100)
    }
}