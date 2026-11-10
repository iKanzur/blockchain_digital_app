# Decentralized Crowdfunding DApp

**Developed by Kanzur Rehman | Roll No. 24i5544 | Section FTD**

A local university demonstration using Solidity, Hardhat 3, React, Vite, Ethers v6 and MetaMask. KYC-approved wallets and the registry admin can create campaigns. Any wallet can contribute. The creator withdraws after a campaign reaches its goal.

## Requirements for project

- Node.js 22 or later and npm
- MetaMask browser extension
- Three PowerShell terminals on the same computer

## Install, test and run on Windows

Open PowerShell in the project folder (the folder containing this README). Run these commands in order. Keep the node terminal running.

**Terminal 1 — blockchain**

```powershell
cd .\blockchain
npm ci
npm run compile
npm test
npm run node
```

**Terminal 2 — deployment**

```powershell
cd .\blockchain
npm run deploy
```

The deployment writes `blockchain/deployments/localhost.json` with both addresses, chain ID and deployment transaction hashes. It also writes the ABIs and addresses to `frontend/src/contracts.json`. It does not approve any user or create a campaign.

**Terminal 3 — React**

```powershell
cd .\frontend
npm ci
npm run build
npm run dev
```

Open the Vite URL printed by the last command, normally `http://127.0.0.1:5173`.

## MetaMask setup

Add a network named **Hardhat Local** with RPC `http://127.0.0.1:8545`, chain ID `31337`, and currency `ETH`. Hardhat prints funded test accounts and their private keys when `npm run node` starts. Import three **local test keys only** into MetaMask:

- **A:** account 0, admin and contract deployer
- **B:** account 1, student and campaign creator
- **C:** account 2, unverified contributor

Do not use these public development keys on a real network. If MetaMask shows an incorrect nonce after resetting the node, use MetaMask's account activity reset or import the local test account again.

## Demonstration

1. Connect B. Submit KYC with full name **Kanzur Rehman** and a dummy CNIC such as `12345-1234567-1`. Observe Pending.
2. Switch to A. In the admin request list, approve B. Observe Approved after switching back to B.
3. As B, create a campaign with a title, description and goal `0.01` ETH.
4. Switch to C. Contribute `0.004` ETH without KYC approval. The campaign remains Active.
5. As C, contribute `0.006` ETH. The campaign becomes Completed and refuses more contributions.
6. Switch to B. Withdraw. The campaign becomes Withdrawn. Raised remains `0.01` ETH; Available becomes zero.
7. As C, submit a separate KYC request with a dummy CNIC. Switch to A and reject it. C sees Rejected.

Approve each MetaMask transaction and wait for the page to show **Transaction confirmed**. The page also updates when another account changes contract state.

**On-chain KYC data is public.** Full names and CNIC values can be read by anyone on this local chain. Use dummy CNIC values only; this is an educational workflow, not a production identity system.

Restarting the default Hardhat node resets all blockchain state. Run `npm run deploy` again, then refresh the browser. The address and ABI file will be replaced with the new deployment.

## Project files

- `blockchain/contracts/`: both Solidity contracts
- `blockchain/test/`: contract tests
- `blockchain/scripts/deploy.js`: deployment and frontend contract export
- `blockchain/deployments/`: generated local deployment record after deployment
- `frontend/src/`: React application and generated `contracts.json`
- `screenshots/`: demonstration screenshot checklist and future captures
- `report/report.md`: assignment report
- `report/requirement-checklist.md`: implementation and verification map
