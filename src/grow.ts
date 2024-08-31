import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    ns.print(JSON.stringify({
        "ts": (new Date).getTime()
    }))

    await ns.grow(ns.args[0].toString())
}