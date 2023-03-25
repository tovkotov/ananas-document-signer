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
    stateMutability: "view",
    type: "function",
  },
];
const contractAddress = "0xa45A1689d97767CB6c700D67bCf7d94352834BBD";

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

document
  .getElementById("uploadDocument")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      documentHash = await getDocumentHash(file);
      document.getElementById("documentHash").innerText = documentHash;
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

// document.getElementById("signDocument").addEventListener("click", async () => {
//   const signerAddress = document.getElementById("signerAddress").value;
//   const documentHash = document.getElementById("documentHash").innerText;
//   const paddedDocumentHash = web3.utils.padLeft("0x" + documentHash, 64);
//   const documentHashBytes = web3.utils.hexToBytes(paddedDocumentHash);

//   if (web3.utils.isAddress(signerAddress)) {
//     try {
//       // Sign the document hash
//       const signature = await web3.eth.sign(paddedDocumentHash, signerAddress);
//       const signatureBytes = "0x" + signature.slice(2);

//       // Send the transaction
//       const tx = await contract.methods
//         .signDocument(documentHashBytes, signatureBytes)
//         .send({ from: signerAddress });

//       document.getElementById("signStatus").innerText = "Document signed";
//     } catch (err) {
//       console.error(err);
//       document.getElementById("signStatus").innerText =
//         "Error signing the document";
//     }
//   } else {
//     document.getElementById("signStatus").innerText = "Invalid signer address";
//   }
// });

document.getElementById("signDocument").addEventListener("click", async () => {
  const signerAddress = document.getElementById("signerAddress").value;
  const documentHash = document.getElementById("documentHash").innerText;
  const paddedDocumentHash = web3.utils.padLeft("0x" + documentHash, 64);

  if (web3.utils.isAddress(signerAddress)) {
    try {
      // Sign the document hash
      const signature = await web3.eth.sign(paddedDocumentHash, signerAddress);

      // Encode the parameters for the signDocument function
      const encodedParameters = web3.eth.abi.encodeParameters(
        ["bytes32", "bytes"],
        [paddedDocumentHash, signature]
      );

      // Send the transaction
      const tx = await contract.methods
        .signDocument(paddedDocumentHash, encodedParameters)
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
