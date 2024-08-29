import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    while (true) {
        await ns.grow(ns.args[0].toString())
        await ns.sleep(10)
    }
}