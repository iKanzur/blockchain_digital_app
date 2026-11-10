// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./KYCRegistry.sol";

contract Crowdfunding_KanzurRehman {
    enum Status { Active, Completed, Withdrawn }
    struct Campaign {
        uint256 id;
        string title;
        string description;
        uint256 goal;
        uint256 fundsRaised;
        uint256 availableFunds;
        address creator;
        Status status;
    }

    KYCRegistry_KanzurRehman public immutable registry;
    Campaign[] private campaigns;

    event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goal);
    event ContributionReceived(uint256 indexed id, address indexed contributor, uint256 amount);
    event CampaignCompleted(uint256 indexed id);
    event FundsWithdrawn(uint256 indexed id, address indexed creator, uint256 amount);

    constructor(address registryAddress) {
        require(registryAddress != address(0), "Invalid registry");
        registry = KYCRegistry_KanzurRehman(registryAddress);
    }

    function createCampaign(string calldata title, string calldata description, uint256 goal) external {
        require(msg.sender == registry.admin() || registry.isVerified(msg.sender), "KYC approval required");
        require(bytes(title).length > 0 && bytes(description).length > 0, "Title and description required");
        require(goal > 0, "Goal must be positive");
        uint256 id = campaigns.length;
        campaigns.push(Campaign(id, title, description, goal, 0, 0, msg.sender, Status.Active));
        emit CampaignCreated(id, msg.sender, title, goal);
    }

    function contribute(uint256 id) external payable {
        require(id < campaigns.length, "Invalid campaign ID");
        Campaign storage campaign = campaigns[id];
        require(campaign.status == Status.Active, "Campaign not active");
        require(msg.value > 0, "Contribution must be positive");
        campaign.fundsRaised += msg.value;
        campaign.availableFunds += msg.value;
        emit ContributionReceived(id, msg.sender, msg.value);
        if (campaign.fundsRaised >= campaign.goal) {
            campaign.status = Status.Completed;
            emit CampaignCompleted(id);
        }
    }

    function withdraw(uint256 id) external {
        require(id < campaigns.length, "Invalid campaign ID");
        Campaign storage campaign = campaigns[id];
        require(msg.sender == campaign.creator, "Creator only");
        require(campaign.status == Status.Completed, "Campaign not completed");
        uint256 amount = campaign.availableFunds;
        campaign.status = Status.Withdrawn;
        campaign.availableFunds = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(id, msg.sender, amount);
    }

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        require(id < campaigns.length, "Invalid campaign ID");
        return campaigns[id];
    }
    function getCampaigns() external view returns (Campaign[] memory) { return campaigns; }
}
