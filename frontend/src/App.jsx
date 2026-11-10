import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import deployment from "./contracts.json";

const labels = ["Not Submitted", "Pending", "Approved", "Rejected"];
const campaignLabels = ["Active", "Completed", "Withdrawn"];
const short = address => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
const errorText = error => {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") return "Wallet request was rejected.";
  return error?.shortMessage || error?.reason || error?.message || "Transaction failed.";
};

export default function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [network, setNetwork] = useState("");
  const [admin, setAdmin] = useState("");
  const [kyc, setKyc] = useState(0);
  const [requests, setRequests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [name, setName] = useState("");
  const [cnic, setCnic] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [amounts, setAmounts] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = Boolean(deployment.registry?.address && deployment.crowdfunding?.address);
  const correctNetwork = network === String(deployment.chainId);
  const isAdmin = account && account.toLowerCase() === admin.toLowerCase();

  async function refresh(address = account) {
    if (!window.ethereum || !ready) return;
    const provider = new BrowserProvider(window.ethereum);
    const chain = await provider.getNetwork();
    setNetwork(String(chain.chainId));
    if (Number(chain.chainId) !== deployment.chainId) return;
    const registry = new Contract(deployment.registry.address, deployment.registryAbi, provider);
    const funding = new Contract(deployment.crowdfunding.address, deployment.crowdfundingAbi, provider);
    const [owner, allCampaigns] = await Promise.all([registry.admin(), funding.getCampaigns()]);
    setAdmin(owner);
    setCampaigns(allCampaigns);
    if (address) {
      const [status, ethBalance] = await Promise.all([registry.getStatus(address), provider.getBalance(address)]);
      setKyc(Number(status));
      setBalance(formatEther(ethBalance));
      if (address.toLowerCase() === owner.toLowerCase()) setRequests(await registry.getRequests());
      else setRequests([]);
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;
    const changed = accounts => { setAccount(accounts[0] || ""); setMessage(""); };
    const chainChanged = () => { setNetwork(""); setCampaigns([]); window.ethereum.request({ method: "eth_chainId" }).then(id => setNetwork(String(BigInt(id)))).catch(() => {}); };
    window.ethereum.on("accountsChanged", changed);
    window.ethereum.on("chainChanged", chainChanged);
    window.ethereum.request({ method: "eth_accounts" }).then(changed).catch(() => {});
    chainChanged();
    return () => { window.ethereum.removeListener("accountsChanged", changed); window.ethereum.removeListener("chainChanged", chainChanged); };
  }, []);

  useEffect(() => {
    if (!correctNetwork || !ready) return;
    refresh(account).catch(error => setMessage(errorText(error)));
    const provider = new BrowserProvider(window.ethereum);
    const registry = new Contract(deployment.registry.address, deployment.registryAbi, provider);
    const funding = new Contract(deployment.crowdfunding.address, deployment.crowdfundingAbi, provider);
    const update = () => refresh(account).catch(() => {});
    const events = [[registry, "KYCSubmitted"], [registry, "KYCApproved"], [registry, "KYCRejected"], [funding, "CampaignCreated"], [funding, "ContributionReceived"], [funding, "CampaignCompleted"], [funding, "FundsWithdrawn"]];
    events.forEach(([contract, event]) => contract.on(event, update));
    return () => events.forEach(([contract, event]) => contract.off(event, update));
  }, [account, network]);

  async function connect() {
    if (!window.ethereum) return setMessage("MetaMask is missing. Install the extension and reload.");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0] || "");
    } catch (error) { setMessage(errorText(error)); }
  }

  async function transact(which, method, args, options) {
    if (!account || !correctNetwork || !ready || busy) return;
    setBusy(true);
    try {
      setMessage("Approve the request in MetaMask…");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(deployment[which].address, deployment[`${which}Abi`], signer);
      const tx = await contract[method](...args, ...(options ? [options] : []));
      setMessage(`Transaction pending: ${tx.hash}`);
      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error("Transaction reverted.");
      setMessage(`Transaction confirmed: ${tx.hash}`);
      await refresh(account);
    } catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }

  return <main>
    <header><p className="eyebrow">BLOCKCHAIN ASSIGNMENT</p><h1>Decentralized Crowdfunding</h1><p className="byline">Developed by Kanzur Rehman | Roll No. 24i5544 | Section FTD</p></header>
    <section className="panel wallet"><div><h2>Wallet</h2><p>{account ? `${short(account)} · ${Number(balance).toFixed(4)} ETH · Chain ${network}` : "Connect MetaMask to participate."}</p></div><button onClick={connect}>{account ? "Switch / Connect" : "Connect MetaMask"}</button></section>
    {!window.ethereum && <p className="notice">MetaMask is missing. Install it in your browser.</p>}
    {!ready && <p className="notice">Contracts are not deployed. Run the deployment command in the README.</p>}
    {account && !correctNetwork && <p className="notice">Wrong network. Select Localhost 8545 (chain ID 31337) in MetaMask.</p>}
    {message && <p className="notice" role="status">{message}</p>}
    <div className="grid">
      <section className="panel"><h2>KYC verification</h2><p>Status: <strong>{labels[kyc]}</strong></p><p className="hint">Approval is required to create a campaign. Any wallet may contribute.</p>{(kyc === 0 || kyc === 3) && <form onSubmit={e => { e.preventDefault(); transact("registry", "submitRequest", [name.trim(), cnic.trim()]); }}><input required placeholder="Full name" value={name} onChange={e => setName(e.target.value)}/><input required placeholder="CNIC (dummy value for demo)" value={cnic} onChange={e => setCnic(e.target.value)}/><button disabled={!account || !correctNetwork || busy}>Submit KYC</button></form>}</section>
      <section className="panel"><h2>Create campaign</h2><p className="hint">Available to approved users and the registry admin.</p><form onSubmit={e => { e.preventDefault(); transact("crowdfunding", "createCampaign", [title.trim(), description.trim(), parseEther(goal)]); }}><input required placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}/><textarea required placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}/><input required type="number" min="0.000000000000000001" step="any" placeholder="Goal in ETH" value={goal} onChange={e => setGoal(e.target.value)}/><button disabled={!account || !correctNetwork || busy || !(kyc === 2 || isAdmin)}>Create campaign</button></form></section>
    </div>
    {isAdmin && <section className="panel"><h2>Admin · KYC requests</h2>{requests.length === 0 ? <p>No requests yet.</p> : requests.map(request => <div className="request" key={request.user}><div><strong>{request.fullName}</strong> · {short(request.user)}<br/><small>CNIC: {request.cnic} · {labels[Number(request.status)]}</small></div>{Number(request.status) === 1 && <div className="actions"><button disabled={busy} onClick={() => transact("registry", "approve", [request.user])}>Approve</button><button disabled={busy} className="secondary" onClick={() => transact("registry", "reject", [request.user])}>Reject</button></div>}</div>)}</section>}
    <section><h2>Campaigns</h2>{campaigns.length === 0 ? <p>No campaigns yet.</p> : <div className="cards">{campaigns.map(campaign => { const id = Number(campaign.id); const status = Number(campaign.status); return <article className="panel" key={id}><div className="cardtop"><span>#{id}</span><strong className="badge">{campaignLabels[status]}</strong></div><h3>{campaign.title}</h3><p>{campaign.description}</p><dl><dt>Goal</dt><dd>{formatEther(campaign.goal)} ETH</dd><dt>Raised</dt><dd>{formatEther(campaign.fundsRaised)} ETH</dd><dt>Available</dt><dd>{formatEther(campaign.availableFunds)} ETH</dd><dt>Creator</dt><dd title={campaign.creator}>{short(campaign.creator)}</dd></dl>{status === 0 && <form onSubmit={e => { e.preventDefault(); transact("crowdfunding", "contribute", [campaign.id], { value: parseEther(amounts[id] || "0") }); }}><input required type="number" min="0.000000000000000001" step="any" placeholder="Amount in ETH" value={amounts[id] || ""} onChange={e => setAmounts({ ...amounts, [id]: e.target.value })}/><button disabled={!account || !correctNetwork || busy}>Contribute</button></form>}{status === 1 && account.toLowerCase() === campaign.creator.toLowerCase() && <button disabled={busy} onClick={() => transact("crowdfunding", "withdraw", [campaign.id])}>Withdraw funds</button>}</article>; })}</div>}</section>
    <footer>Local Hardhat network · Educational demonstration</footer>
  </main>;
}
