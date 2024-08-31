import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    ns.scriptKill("01.1_hackLoopV2.js", "home")
    ns.ls("home", "proc/").forEach(f => {
        ns.rm(f, "home")
    })
}