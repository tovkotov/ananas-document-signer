// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentSignature {
    struct Document {
        bytes32 documentHash;
        address[] signers;
        mapping(address => bool) hasSigned;
    }

    mapping(bytes32 => Document) public documents;

    function addDocument(bytes32 _documentHash, address[] memory _signers) public {
        require(documents[_documentHash].documentHash == 0, "Document already exists");
        
        documents[_documentHash].documentHash = _documentHash;
        documents[_documentHash].signers = _signers;
    }

    function signDocument(bytes32 _documentHash) public {
        require(documents[_documentHash].documentHash != 0, "Document not found");
        require(documents[_documentHash].hasSigned[msg.sender] == false, "Already signed");

        bool isSigner = false;
        for (uint i = 0; i < documents[_documentHash].signers.length; i++) {
            if (documents[_documentHash].signers[i] == msg.sender) {
                isSigner = true;
                break;
            }
        }
        require(isSigner, "Not a signer");

        documents[_documentHash].hasSigned[msg.sender] = true;
    }

    function getSignersStatus(bytes32 _documentHash) public view returns (address[] memory, bool[] memory) {
        address[] memory signers = documents[_documentHash].signers;
        bool[] memory signedStatus = new bool[](signers.length);

        for (uint i = 0; i < signers.length; i++) {
            signedStatus[i] = documents[_documentHash].hasSigned[signers[i]];
        }

        return (signers, signedStatus);
    }
}
