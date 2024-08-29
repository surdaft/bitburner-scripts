import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    const [scriptName, threads] = ns.args
    // loop through all the servers I have available and see if I can squeeze
    // this script in with that number of threads

    const cost = (ns.getScriptRam(scriptName.toString(), "home") * parseInt(threads.toString()))
    const servers = ns.scan("home")

    let foundServer = null;
    for (const hostName of servers) {
        const server = ns.getServer(hostName)
        if ((server.maxRam - server.ramUsed) >= cost) {
            foundServer = server
            break
        }
    }

    if (foundServer !== null) {
        ns.print(foundServer)
        return
    }

    ns.print("null")
}