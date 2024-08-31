import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    for (let i = 1; i <= 20; i++) {
        const r = 2 ** i
        ns.tprint(ns.formatRam(r).padEnd(10, " "), r.toString().padEnd(10, " "), ns.formatNumber(ns.getPurchasedServerCost(r)))
    }
}