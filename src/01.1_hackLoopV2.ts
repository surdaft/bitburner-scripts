import { NS, Player, Server } from '@ns'

const baseCost = 1.75
const hackAmountPercent = 0.8

let home: Server
let player: Player

export async function main(ns: NS): Promise<void> {
    const input = ns.flags([
        // node which will host the execution of scripts
        ["node", "home"],
        // the host which we are targeting
        ["host", ""],
    ])

    // get the host information
    const node = input.node.toString()
    const host = input.host.toString()

    ns.print({ input })

    const procFile = "proc/" + host + ".json"
    ns.print({ procFile })

    if (node !== "home") {
        ns.scp([
            "weaken.js",
            "grow.js",
            "hack.js"
        ], node, "home")
    }

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
        player = ns.getPlayer()

        const existingPidWeaken = ns.getRunningScript("weaken.js", home.hostname, hostInfo.hostname)
        const existingPidGrowth = ns.getRunningScript("grow.js", home.hostname, hostInfo.hostname)
        const existingPidHack = ns.getRunningScript("hack.js", home.hostname, hostInfo.hostname)

        if (existingPidWeaken || existingPidGrowth || existingPidHack) {
            ns.print("already running, sleeping")
            await ns.sleep(5000)
            continue
        }

        await checkWeaken(ns, hostInfo, procFile)
        await checkGrowth(ns, hostInfo, procFile)
        await hackServer(ns, hostInfo, procFile)

        await ns.sleep(100)
    }
}

async function checkWeaken(ns: NS, hostInfo: Server, procFile: string) {
    if (hostInfo.hackDifficulty === hostInfo.minDifficulty) {
        return
    }

    // calculate the required threads to fully weaken server
    const weakenEffect = ns.weakenAnalyze(1)
    let weakenThreads = ((hostInfo.hackDifficulty || 2) - (hostInfo.minDifficulty || 1)) / weakenEffect
    const weakenTime = ns.getWeakenTime(hostInfo.hostname)

    if (weakenThreads < 1) {
        ns.print("ERROR: weakenThreads is <1")
        ns.write(procFile, JSON.stringify({
            status: "weaken threads < 1",
            ts: (new Date).getTime(),
            duration: 0
        }), "w")
        return
    }

    const startingThreads = weakenThreads
    let weakenRamCost = baseCost * weakenThreads;
    for (; weakenRamCost > (home.maxRam - (home.ramUsed || 0)) && weakenThreads > 2; weakenThreads--) {
        weakenRamCost = baseCost * weakenThreads
    }

    if (startingThreads !== weakenThreads) {
        // ns.tprint(home.hostname, " is underprovisioned. needed ", ns.formatRam(baseCost * startingThreads), ", actually used ", ns.formatRam(weakenRamCost))
    }

    ns.write(procFile, JSON.stringify({
        status: "weaken",
        ts: (new Date).getTime(),
        duration: weakenTime
    }), "w")

    if (ns.exec("weaken.js", home.hostname, Math.ceil(weakenThreads), hostInfo.hostname)) {
        await ns.sleep(weakenTime + 100)
    }
}

async function checkGrowth(ns: NS, hostInfo: Server, procFile: string) {
    if (hostInfo.moneyAvailable === hostInfo.moneyMax) {
        return
    }

    // calculate the required threads to fully grow the server
    let growthThreads = hostInfo.moneyMax || 1
    const growthRequired = ((hostInfo.moneyAvailable || 1) / (hostInfo.moneyMax || 1)) * 100
    if (growthRequired > 1) {
        growthThreads = ns.growthAnalyze(hostInfo.hostname, growthRequired)
    }

    if (growthThreads < 1) {
        ns.print("ERROR: growthThreads is < 1")
        ns.write(procFile, JSON.stringify({
            status: "grow threads < 1",
            ts: (new Date).getTime(),
            duration: 0
        }), "w")
        return
    }

    const growthTime = ns.getGrowTime(hostInfo.hostname)

    const startingThreads = growthThreads
    let growthRamCost = baseCost * growthThreads;
    for (; growthRamCost > (home.maxRam - (home.ramUsed || 0)) && growthThreads > 2; growthThreads--) {
        growthRamCost = baseCost * growthThreads
    }

    if (startingThreads !== growthThreads) {
        // ns.tprint(home.hostname, " is underprovisioned. needed ", ns.formatRam(baseCost * startingThreads), ", actually used ", ns.formatRam(growthRamCost))
    }

    ns.write(procFile, JSON.stringify({
        status: "grow",
        ts: (new Date).getTime(),
        duration: growthTime
    }), "w")

    if (ns.exec("grow.js", home.hostname, Math.ceil(growthThreads), hostInfo.hostname)) {
        await ns.sleep(growthTime + 100)
    }
}

async function hackServer(ns: NS, hostInfo: Server, procFile: string) {
    const moneyAvailable = hostInfo.moneyAvailable
    const moneyMax = hostInfo.moneyMax

    if (moneyAvailable === undefined || moneyMax === undefined) {
        return
    }

    if (moneyAvailable < moneyMax) {
        return
    }

    if (player.skills.hacking < (hostInfo.requiredHackingSkill || 0)) {
        ns.write(procFile, JSON.stringify({
            status: "hacking levels required: " + ((hostInfo.requiredHackingSkill || 0) - player.skills.hacking).toString().padStart(3, " "),
            ts: (new Date).getTime(),
            duration: 0
        }), "w")
        return
    }

    const hackAmount = moneyAvailable * hackAmountPercent
    let hackThreads = ns.hackAnalyzeThreads(hostInfo.hostname, hackAmount)
    let hackRamCost = baseCost * hackThreads
    const hackTime = ns.getHackTime(hostInfo.hostname)

    if (hackThreads < 1) {
        ns.print("ERROR: hackThreads is <1")
        ns.write(procFile, JSON.stringify({
            status: "hack threads < 1",
            ts: (new Date).getTime(),
            duration: 0
        }), "w")
        return
    }

    const startingThreads = hackThreads
    for (; hackRamCost > (home.maxRam - (home.ramUsed || 0)) && hackThreads > 2; hackThreads--) {
        hackRamCost = baseCost * hackThreads
    }

    if (startingThreads !== hackThreads) {
        // ns.tprint(home.hostname, " is underprovisioned. needed ", ns.formatRam(baseCost * startingThreads), ", actually used ", ns.formatRam(hackRamCost))
    }

    ns.write(procFile, JSON.stringify({
        status: "hack",
        ts: (new Date).getTime(),
        duration: hackTime
    }), "w")

    if (ns.exec("hack.js", home.hostname, Math.ceil(hackThreads), hostInfo.hostname)) {
        await ns.sleep(hackTime + 100)
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: AutocompleteData, args: string[]): string[] {
    return [...data.servers]
}