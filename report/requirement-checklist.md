# Requirement checklist

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Exact contract names and filenames | `blockchain/contracts/KYCRegistry.sol`, `Crowdfunding.sol` | Compile |
| Admin, KYC states, submission, list, approval, rejection, resubmission | `KYCRegistry.sol` | KYC tests; MetaMask demo 1, 2, 7 |
| KYC events and admin restrictions | `KYCRegistry.sol` | KYC tests |
| Admin and approved creator permissions | `Crowdfunding.sol` | Creation tests; demo 3 |
| Campaign fields, validation, listing and event | `Crowdfunding.sol` | Creation tests |
| Unverified contributions, partial, exact and over-goal completion | `Crowdfunding.sol` | Contribution tests; demo 4, 5 |
| Invalid IDs, zero values and later contribution rejection | `Crowdfunding.sol` | Contribution tests |
| Creator-only withdrawal, campaign balance separation, history | `Crowdfunding.sol` | Withdrawal tests; demo 6 |
| MetaMask signer, wallet, network, forms, admin actions and campaign cards | `frontend/src/App.jsx` | Production build; manual demo |
| Transaction states, errors, refresh and event listeners | `frontend/src/App.jsx` | Manual demo required |
| Local deployment, ABI export and record | `blockchain/scripts/deploy.js` | Deployment command |
| Setup and three-account walkthrough | `README.md` | Manual demo required |
| Screenshot checklist and report | `screenshots/README.md`, `report/report.md` | File inspection; captures pending |
