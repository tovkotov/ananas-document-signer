const contractAddress = "0x771081962f7b173eAdf523945c5994e53d0Ab304";
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
        internalType: "bytes32",
        name: "signatureHash",
        type: "bytes32",
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
        internalType: "bytes32",
        name: "signatureHash",
        type: "bytes32",
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
        internalType: "bytes32",
        name: "signatureHash",
        type: "bytes32",
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

const provider = new ethers.providers.Web3Provider(window.ethereum, 97);

let signer;
let contract;

const fileInput = document.getElementById("file-input");
const hashOutput = document.getElementById("hash-output");
const signerInput = document.getElementById("signer-input");
const signerList = document.getElementById("signer-list");
const nameInput = document.getElementById("name-input");
const addSignerButton = document.getElementById("add-signer-button");
const signButton = document.getElementById("sign-button");
const checkSignaturesButton = document.getElementById(
  "check-signatures-button"
);

const signers = new Set();

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  const hash = await calculateSHA256(file);
  hashOutput.value = hash;
});

provider.addEventListener("eth_requestAccounts", []).then(() => {
  // provider.listAccounts().then((accounts) => {
  //   signer = provider.getSigner(accounts[0]);
  //   contract = new ethers.Contract(contractAddress, abi, signer);
  // });
  const signer = signerInput.value.trim();
  if (signer) {
    signers.add(signer);
    signerList.value = [...signers].join("\n");
    signerInput.value = "";
  }
});

addSignerButton.addEventListener("click", () => {
  const signer = signerInput.value.trim();
  if (signer) {
    signers.add(signer);
    signerList.value = [...signers].join("\n");
    signerInput.value = "";
  }
});

signButton.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (name && signers.has(name)) {
    alert("Document signed");
  }
});

checkSignaturesButton.addEventListener("click", () => {
  if (signers.size > 0) {
    alert([...signers].join(", "));
  } else {
    alert("none");
  }
});

function calculateSHA256(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      crypto.subtle
        .digest("SHA-256", buffer)
        .then((hash) => {
          const hexString = Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          resolve(hexString);
        })
        .catch(reject);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
