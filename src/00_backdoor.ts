import { NS } from '@ns'
import { deepScanFlat } from "./server_list"

/**
 * Check that we can access all servers possible
 * @param ns
 */
export async function main(ns: NS): Promise<void> {
    const hostList = deepScanFlat(ns, "home")
    hostList.forEach(v => {
        if (!v.hasAdminRights && !v.purchasedByPlayer) {
            ns.tprint("checking host: ", v.hostname)
            ns.exec("00.1_backdoor_check.js", "home", 1, v.hostname)
        }
    })
}