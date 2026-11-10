// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract KYCRegistry_KanzurRehman {
    enum Status { NotSubmitted, Pending, Approved, Rejected }
    struct Request { address user; string fullName; string cnic; Status status; }

    address public immutable admin;
    mapping(address => Request) private requests;
    address[] private applicants;

    event KYCSubmitted(address indexed user);
    event KYCApproved(address indexed user);
    event KYCRejected(address indexed user);

    constructor() { admin = msg.sender; }

    modifier onlyAdmin() { require(msg.sender == admin, "Admin only"); _; }

    function submitRequest(string calldata fullName, string calldata cnic) external {
        require(bytes(fullName).length > 0 && bytes(cnic).length > 0, "Name and CNIC required");
        Status oldStatus = requests[msg.sender].status;
        require(oldStatus != Status.Pending && oldStatus != Status.Approved, "Request already active");
        if (oldStatus == Status.NotSubmitted) applicants.push(msg.sender);
        requests[msg.sender] = Request(msg.sender, fullName, cnic, Status.Pending);
        emit KYCSubmitted(msg.sender);
    }

    function approve(address user) external onlyAdmin {
        require(requests[user].status == Status.Pending, "Not pending");
        requests[user].status = Status.Approved;
        emit KYCApproved(user);
    }

    function reject(address user) external onlyAdmin {
        require(requests[user].status == Status.Pending, "Not pending");
        requests[user].status = Status.Rejected;
        emit KYCRejected(user);
    }

    function getRequest(address user) external view returns (Request memory) { return requests[user]; }
    function getRequests() external view returns (Request[] memory result) {
        result = new Request[](applicants.length);
        for (uint256 i = 0; i < applicants.length; i++) result[i] = requests[applicants[i]];
    }
    function getStatus(address user) external view returns (Status) { return requests[user].status; }
    function isVerified(address user) external view returns (bool) { return requests[user].status == Status.Approved; }
}
