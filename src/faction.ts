import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    const factionName = "CyberSec";
    const workType = "hacking";

    const success = ns.singularity.workForFaction(factionName, workType);
    if (!success) ns.tprint(`ERROR: Failed to start work for ${factionName} with work type ${workType}.`);
}