import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    await ns.weaken(ns.args[0].toString())
    const now = new Date()
    ns.printf("[%s] completed weaken for `%s`", [
        now.getHours().toString().padStart(2, '0'),
        now.getMinutes().toString().padStart(2, '0'),
        now.getSeconds().toString().padStart(2, '0'),
        now.getMilliseconds().toString().padEnd(3, '0')
    ].join(':'), ns.args[0])
}