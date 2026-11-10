import { describe, it } from "mocha";
import assert from "node:assert/strict";
import hre from "hardhat";

const { ethers } = await hre.network.create();
const eth = ethers.parseEther;

async function setup() {
  const [admin, student, contributor, other] = await ethers.getSigners();
  const registry = await ethers.deployContract("KYCRegistry_KanzurRehman");
  await registry.waitForDeployment();
  const funding = await ethers.deployContract("Crowdfunding_KanzurRehman", [await registry.getAddress()]);
  await funding.waitForDeployment();
  return { admin, student, contributor, other, registry, funding };
}

async function approveStudent(registry, student, admin) {
  await registry.connect(student).submitRequest("Kanzur Rehman", "12345-1234567-1");
  await registry.connect(admin).approve(student.address);
}

describe("KYC registry", () => {
  it("submits, lists, approves, and prevents duplicate or approved replacement", async () => {
    const { registry, student, admin } = await setup();
    assert.equal(await registry.getStatus(student.address), 0n);
    await registry.connect(student).submitRequest("Kanzur Rehman", "12345-1234567-1");
    assert.equal(await registry.getStatus(student.address), 1n);
    assert.equal((await registry.getRequests()).length, 1);
    await assert.rejects(registry.connect(student).submitRequest("Again", "dummy"));
    await assert.rejects(registry.connect(student).approve(student.address));
    await registry.connect(admin).approve(student.address);
    assert.equal(await registry.isVerified(student.address), true);
    await assert.rejects(registry.connect(student).submitRequest("Again", "dummy"));
  });
  it("rejects and permits resubmission without duplicating list entry", async () => {
    const { registry, student, admin } = await setup();
    await registry.connect(student).submitRequest("Student", "dummy-1");
    await assert.rejects(registry.connect(student).reject(student.address));
    await registry.connect(admin).reject(student.address);
    assert.equal(await registry.getStatus(student.address), 3n);
    await registry.connect(student).submitRequest("Student Again", "dummy-2");
    assert.equal((await registry.getRequests()).length, 1);
    assert.equal((await registry.getRequest(student.address)).cnic, "dummy-2");
  });
});

describe("Crowdfunding", () => {
  it("allows approved users and admin, rejects unverified users and invalid inputs", async () => {
    const { registry, funding, admin, student, contributor } = await setup();
    await assert.rejects(funding.connect(student).createCampaign("A", "B", 1n));
    await approveStudent(registry, student, admin);
    await assert.rejects(funding.connect(student).createCampaign("", "B", 1n));
    await assert.rejects(funding.connect(student).createCampaign("A", "", 1n));
    await assert.rejects(funding.connect(student).createCampaign("A", "B", 0n));
    const tx = await funding.connect(student).createCampaign("Library", "Books", eth("0.01"));
    const receipt = await tx.wait();
    assert.ok(receipt.logs.some(log => { try { return funding.interface.parseLog(log)?.name === "CampaignCreated"; } catch { return false; } }));
    const campaign = await funding.getCampaign(0);
    assert.equal(campaign.id, 0n);
    assert.equal(campaign.title, "Library");
    assert.equal(campaign.description, "Books");
    assert.equal(campaign.goal, eth("0.01"));
    assert.equal(campaign.creator, student.address);
    await funding.connect(admin).createCampaign("Admin", "No KYC", 1n);
    assert.equal((await funding.getCampaigns()).length, 2);
    await assert.rejects(funding.connect(contributor).createCampaign("No", "KYC", 1n));
    await assert.rejects(funding.getCampaign(99));
  });
  it("accepts unverified contributions, completes at exact goal, and rejects later funding", async () => {
    const { funding, contributor } = await setup();
    await funding.createCampaign("A", "B", eth("0.01"));
    await assert.rejects(funding.connect(contributor).contribute(99, { value: 1n }));
    await assert.rejects(funding.connect(contributor).contribute(0, { value: 0n }));
    await funding.connect(contributor).contribute(0, { value: eth("0.004") });
    assert.equal((await funding.getCampaign(0)).status, 0n);
    assert.equal((await funding.getCampaign(0)).fundsRaised, eth("0.004"));
    await funding.connect(contributor).contribute(0, { value: eth("0.006") });
    assert.equal((await funding.getCampaign(0)).status, 1n);
    await assert.rejects(funding.connect(contributor).contribute(0, { value: 1n }));
  });
  it("accepts over-goal amount and protects each campaign balance", async () => {
    const { funding, contributor, other, admin } = await setup();
    await funding.createCampaign("A", "B", eth("0.01"));
    await funding.createCampaign("C", "D", eth("0.02"));
    await funding.connect(contributor).contribute(0, { value: eth("0.012") });
    await funding.connect(other).contribute(1, { value: eth("0.005") });
    await assert.rejects(funding.connect(other).withdraw(0));
    await assert.rejects(funding.connect(admin).withdraw(1));
    await assert.rejects(funding.connect(admin).withdraw(99));
    await funding.connect(admin).withdraw(0);
    const first = await funding.getCampaign(0);
    const second = await funding.getCampaign(1);
    assert.equal(first.status, 2n);
    assert.equal(first.fundsRaised, eth("0.012"));
    assert.equal(first.availableFunds, 0n);
    assert.equal(second.availableFunds, eth("0.005"));
    assert.equal(await ethers.provider.getBalance(await funding.getAddress()), eth("0.005"));
    await assert.rejects(funding.connect(admin).withdraw(0));
  });
});
