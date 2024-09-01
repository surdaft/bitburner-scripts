import { NS, Server, ScriptArg } from '@ns'
import { deepScanFlat } from '/server_list'

export async function main(ns: NS): Promise<void> {
    const input = ns.flags([
        ["loop", false],
        ["backdoor", true],
        ["node", "home"],
        ["page", []],
        ["loopScript", "01.1_hackLoopV3.js"]
    ])

    const memory: Map<string, boolean> = new Map<string, boolean>()

    ns.run("stats.js")

    if (input.loop) {
        while (true) {
            execute(ns, input, memory)
            await ns.sleep(30000)
        }
    } else {
        execute(ns, input, memory)
    }
}

function execute(ns: NS, input: { [key: string]: string[] | ScriptArg; }, memory: Map<string, boolean>) {
    const player = ns.getPlayer()
    if (input.backdoor) {
        ns.run("00_backdoor.js")
    }

    const hostList = deepScanFlat(ns, "home")
    let arr: Array<Server> = []
    hostList.forEach((v: Server) => {
        if (
            // server is nuked (does not require hacking skill)
            v.hasAdminRights
            // dont hack ourselves
            && !v.purchasedByPlayer
            // has some money available
            && (v.moneyAvailable || 0) > 0
            // we have high enough hacking skill
            && (v.requiredHackingSkill || 0) < player.skills.hacking
            // we aren't already aware of this script (primarily used for the loop)
            && !memory.has(v.hostname)
        ) {
            arr.push(v)
        }
    })

    arr.sort((a: Server, b: Server) => {
        return (a.moneyMax || 0) - (b.moneyMax || 0)
    })

    const paged = input.page as string[]
    if (paged.length == 2) {
        arr = arr.slice(parseInt(paged[0]), parseInt(paged[1]))
    }

    arr.forEach((s) => {
        ns.tprint("starting for ", s.hostname)
        switch (input.loopScript) {
            case "01_hackLoop.js": {
                if (ns.run(input.loopScript, 1, s.hostname) === 0) {
                    ns.tprint("ERROR: ", "did not start loop for ", s.hostname)
                }

                break
            }

            case "01.1_hackLoopV2.js": {
                if (ns.run(input.loopScript, 1, "--node=" + input.node, "--host=" + s.hostname) === 0) {
                    ns.tprint("ERROR: ", "did not start loop for ", s.hostname)
                }

                break
            }

            case "01.1_hackLoopV3.js": {
                if (ns.run(input.loopScript, 1, "--home=" + input.node, "--target=" + s.hostname) === 0) {
                    ns.tprint("ERROR: ", "did not start loop for ", s.hostname)
                }

                break
            }
        }

        memory.set(s.hostname, true)
    })
}