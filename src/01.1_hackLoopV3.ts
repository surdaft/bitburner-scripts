import { NS, Server } from '@ns'

function usage(ns: NS) {
    ns.tprintf("ERROR: usage `run %s --target <target> --home <home>`", ns.getScriptName())
}

export async function main(ns: NS): Promise<void> {
    // identify the target server
    // identify the timings of things at each situation
    //  - get hack time
    //  - get growth
    //  - get weaken
    //  - identify how to schedule them to weaken, grow, weaken, hack

    const input = ns.flags([
        ['target', ''],
        ['home', 'home']
    ])

    const target = input.target.toString()
    if (target === '') {
        usage(ns)
        return
    }

    const home = input.home.toString()
    if (home === '') {
        usage(ns)
        return
    }

    const homeInfo = ns.getServer(home)
    const targetInfo = ns.getServer(target)
    const player = ns.getPlayer()

    const timings = {
        hack: ns.formulas.hacking.hackTime(targetInfo, player),
        grow: ns.formulas.hacking.growTime(targetInfo, player),
        weaken: ns.formulas.hacking.weakenTime(targetInfo, player)
    }

    const threads = {
        // assume that we are hacking 80% of the available
        hack: Math.ceil((ns.formulas.hacking.hackPercent(targetInfo, player) / 0.8) * 100),

        // calculate the threads needed to grow 80% of the money
        grow: Math.ceil(ns.growthAnalyze(
            targetInfo.hostname,
            ((targetInfo.moneyMax || 1) / ((targetInfo.moneyMax || 1) * 0.2)) * 100,
            homeInfo.cpuCores
        )),

        // attempt to weaken from baseSecurity
        weaken: (Math.ceil(((targetInfo.baseDifficulty || 2) - (targetInfo.minDifficulty || 1)) / ns.weakenAnalyze(1, homeInfo.cpuCores))) + 1
    }

    if (threads.hack < 0) {
        ns.tprintf("couldnt do the hack? something wrong here")
        return
    }

    // I want to:
    // (weaken -> grow -> weaken -> hack) -> start again
    ns.disableLog('exec')
    ns.disableLog('sleep')

    ns.print(JSON.stringify({ threads, timings }, undefined, 2))

    setTimeout(() => {
        doLoop(ns, homeInfo, targetInfo, threads, timings)
    }, (timings.weaken - timings.hack) + 10)

    while (true) {
        await ns.asleep(10000)
    }
}

function doLoop(ns: NS, homeInfo: Server, targetInfo: Server, threads: any, timings: any) {
    weaken(ns, homeInfo, targetInfo, threads.weaken, 0)
    grow(ns, homeInfo, targetInfo, threads.grow, (timings.weaken - timings.grow) + 100)
    weaken(ns, homeInfo, targetInfo, threads.weaken, 300)
    hack(ns, homeInfo, targetInfo, threads.hack, (timings.grow - timings.hack) + 100)

    setTimeout(() => {
        doLoop(ns, homeInfo, targetInfo, threads, timings)
    }, (timings.weaken - timings.hack) + 10)
}

function grow(ns: NS, homeInfo: Server, targetInfo: Server, threads: number, delayMs: number) {
    setTimeout(() => {
        ns.exec('grow.js', homeInfo.hostname, threads, targetInfo.hostname)
    }, delayMs)
}

function weaken(ns: NS, homeInfo: Server, targetInfo: Server, threads: number, delayMs: number) {
    setTimeout(() => {
        ns.exec('weaken.js', homeInfo.hostname, threads, targetInfo.hostname)
    }, delayMs)
}

function hack(ns: NS, homeInfo: Server, targetInfo: Server, threads: number, delayMs: number) {
    setTimeout(() => {
        ns.exec('hack.js', homeInfo.hostname, threads, targetInfo.hostname)
    }, delayMs)
}