const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "signer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "signatureHash",
        type: "bytes",
      },
    ],
    name: "DocumentSigned",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
      {
        internalType: "address[]",
        name: "signerAddresses",
        type: "address[]",
      },
    ],
    name: "saveSigners",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signatureHash",
        type: "bytes",
      },
    ],
    name: "signDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "documentSignatures",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "getSigner",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
    ],
    name: "getSigners",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "signedDocuments",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signatureHash",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "verifySignature",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];
const contractAddress = "0x180c653f6b6C94604e51A63BEA06a04d544Ecc46";

let documentHash;
let signers = new Set();
let web3;
let contract;
let userAccount;

async function init() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      web3 = new Web3(window.ethereum);
      contract = new web3.eth.Contract(abi, contractAddress);
      userAccount = (await web3.eth.getAccounts())[0];
    } catch (error) {
      console.error(error);
    }
  } else {
    alert("Please install MetaMask!");
  }
}

async function getDocumentHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (event) {
      const arrayBuffer = event.target.result;
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const hash = CryptoJS.SHA3(wordArray, { outputLength: 256 }).toString();
      resolve(hash);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function loadSigners(documentHash) {
  const paddedDocumentHash = web3.utils.padLeft("0x" + documentHash, 64);

  for (const signer of signers) {
    const signature = await contract.methods
      .getSigner(paddedDocumentHash, signer)
      .call();
    if (signature !== "0x") {
      document.getElementById("signatureList").value += `${signer}\n`;
    }
  }
}

document
  .getElementById("uploadDocument")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      documentHash = await getDocumentHash(file);
      document.getElementById("documentHash").innerText = documentHash;

      // Загрузите подписантов с блокчейна, если они существуют
      try {
        const paddedDocumentHash = web3.utils.padLeft("0x" + documentHash, 64);
        const blockchainSigners = await contract.methods
          .getSigners(paddedDocumentHash)
          .call();

        // Обновите список подписантов в интерфейсе
        signers = new Set(blockchainSigners);
        document.getElementById("signerList").value =
          Array.from(signers).join("\n");
      } catch (err) {
        console.error(err);
      }
    }
  });

document.getElementById("addSigner").addEventListener("click", () => {
  const signerAddress = document.getElementById("signerAddress").value.trim();
  if (web3.utils.isAddress(signerAddress)) {
    signers.add(signerAddress);
    document.getElementById("signerList").value =
      Array.from(signers).join("\n");
  } else {
    alert("Invalid address");
  }
});

document.getElementById("saveSigners").addEventListener("click", async () => {
  const documentHash = document.getElementById("documentHash").innerText;
  const paddedDocumentHash = web3.utils.padLeft("0x" + documentHash, 64);
  const signerAddresses = Array.from(signers);

  try {
    // Вызов функции смарт-контракта для сохранения подписантов
    const tx = await contract.methods
      .saveSigners(paddedDocumentHash, signerAddresses)
      .send({ from: userAccount });

    document.getElementById("signStatus").innerText = "Signers saved";
  } catch (err) {
    console.error(err);
    document.getElementById("signStatus").innerText = "Error saving signers";
  }
});

document.getElementById("signDocument").addEventListener("click", async () => {
  const signerAddress = document.getElementById("signerAddress").value;
  const documentHash = document.getElementById("documentHash").innerText;
  const paddedDocumentHash = web3.utils.padLeft("0x" + documentHash, 64);

  if (web3.utils.isAddress(signerAddress)) {
    try {
      // Sign the document hash
      const signature = await web3.eth.sign(paddedDocumentHash, signerAddress);

      // Send the transaction
      const tx = await contract.methods
        .signDocument(paddedDocumentHash, signature)
        .send({ from: signerAddress });

      document.getElementById("signStatus").innerText = "Document signed";
    } catch (err) {
      console.error(err);
      document.getElementById("signStatus").innerText =
        "Error signing the document";
    }
  } else {
    document.getElementById("signStatus").innerText = "Invalid signer address";
  }
});

document
  .getElementById("checkSignatures")
  .addEventListener("click", async () => {
    const signedAddresses = [];

    for (const signer of signers) {
      const signatureHash = web3.utils.sha3(documentHash + signer);
      const isSigned = await contract.methods
        .verifySignature(documentHash, signatureHash, signer)
        .call();
      if (isSigned) {
        signedAddresses.push(signer);
      }
    }

    if (signedAddresses.length > 0) {
      document.getElementById("signatureList").value =
        signedAddresses.join("\n");
    } else {
      document.getElementById("signatureList").value = "No signatures found";
    }
  });

init();
