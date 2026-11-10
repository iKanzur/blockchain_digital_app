import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { ethers } = await hre.network.create();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const registry = await ethers.deployContract("KYCRegistry_KanzurRehman");
await registry.waitForDeployment();
const funding = await ethers.deployContract("Crowdfunding_KanzurRehman", [await registry.getAddress()]);
await funding.waitForDeployment();
const network = await ethers.provider.getNetwork();
const deployment = {
  chainId: Number(network.chainId),
  registry: { address: await registry.getAddress(), transactionHash: registry.deploymentTransaction().hash },
  crowdfunding: { address: await funding.getAddress(), transactionHash: funding.deploymentTransaction().hash }
};
const artifact = name => JSON.parse(fs.readFileSync(path.join(root, "blockchain", "artifacts", "contracts", `${name}.sol`, `${name}_KanzurRehman.json`), "utf8")).abi;
fs.writeFileSync(path.join(root, "blockchain", "deployments", "localhost.json"), JSON.stringify(deployment, null, 2) + "\n");
fs.writeFileSync(path.join(root, "frontend", "src", "contracts.json"), JSON.stringify({ ...deployment, registryAbi: artifact("KYCRegistry"), crowdfundingAbi: artifact("Crowdfunding") }, null, 2) + "\n");
console.log(JSON.stringify(deployment, null, 2));
