# Assignment report

**Student:** Kanzur Rehman · **Roll No.:** 24i5544 · **Section:** FTD

## Objective and architecture

This project demonstrates a decentralized crowdfunding flow on a local Hardhat blockchain. A Solidity KYC registry stores requests and approvals. A separate crowdfunding contract checks the registry before campaign creation. A single React page reads both contracts through Ethers v6 and sends transactions through the connected MetaMask signer. There is no server or database.

## Contracts and functionality

`KYCRegistry_KanzurRehman` records applicant address, name, CNIC and status. Its deployer is the admin. The admin approves or rejects pending requests; rejected applicants can resubmit. `Crowdfunding_KanzurRehman` stores campaigns and checks KYC approval or admin status for creation. Any wallet can contribute. Reaching the goal completes the campaign, and only its creator can withdraw its available balance. Historical funds raised remains visible. Both contracts emit events for key changes.

## Testing and deployment

The deployment script records addresses and transaction hashes in `blockchain/deployments/localhost.json` and exports frontend ABIs and addresses. A local node reset requires redeployment.

**Contract tests:** `npm run compile` succeeded with Solidity 0.8.28. `npm test` passed: 5 Mocha tests, 0 failed. Tests covered KYC transitions and permissions; approved/admin campaign creation; unverified contributions; partial, exact and over-goal funding; invalid input and IDs; completion; withdrawal restrictions; historical totals; and separate campaign balances.

**Frontend production build:** `npm run build` passed with Vite 7.3.7. The production output was generated in `frontend/dist/`.

**Local deployment:** `npm run deploy` succeeded against a local Hardhat node, chain ID 31337. The registry was deployed at `0x5FbDB2315678afecb367f032d93F642f64180aa3` in transaction `0xe135020f459e4c1bc12940bba6346203950bc4ee36a4091f8afd31dc0e68f25d`. Crowdfunding was deployed at `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` in transaction `0xc4dbbcce3a37dbaafbeea3c0157af249227cc44597b345b9389987a82a10c23e`. These addresses are valid only for this node instance.

## Limitations

This is a local educational project. On-chain KYC names and CNICs are public, so dummy values are required. It has no real identity verification, campaign deadlines, refunds or production security review. Full over-goal contributions are accepted. Screenshots require a real MetaMask demonstration.

## Screenshot placeholders

Place the real captures listed in `screenshots/README.md` here when available. **No screenshot is included or fabricated.**
