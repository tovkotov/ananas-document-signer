const contractABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_documentHash",
        type: "bytes32",
      },
      {
        internalType: "address[]",
        name: "_signers",
        type: "address[]",
      },
    ],
    name: "addDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_documentHash",
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
        name: "",
        type: "bytes32",
      },
    ],
    name: "documents",
    outputs: [
      {
        internalType: "bytes32",
        name: "documentHash",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_documentHash",
        type: "bytes32",
      },
    ],
    name: "getSignersStatus",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "bool[]",
        name: "",
        type: "bool[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
const contractAddress = "0x74168548C66272B7B6c56732DA04d63868dBC66A";

// для binance testnet
const provider = new ethers.providers.Web3Provider(window.ethereum, 97);

// для локального ганаш
// const provider = new ethers.providers.Web3Provider(window.ethereum);

let signer;
let contractInstance;

async function init() {
  await window.ethereum.enable();
  signer = provider.getSigner();
  contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
}

async function addDocument() {
  const fileInput = document.getElementById("file-input");
  const signersInput = document.getElementById("signers-input").value;
  const signers = signersInput.split(",").map((s) => s.trim());
  const documentHash = await calculateDocumentHash(fileInput);

  console.log(documentHash);
  try {
    await contractInstance.addDocument(documentHash, signers);
    document.getElementById("add-document-status").innerText =
      "Документ добавлен";
  } catch (err) {
    document.getElementById("add-document-status").innerText =
      "Ошибка: " + err.message;
  }
}

async function signDocument() {
  const fileInput = document.getElementById("file-input");
  const documentHash = await calculateDocumentHash(fileInput);

  try {
    await contractInstance.signDocument(documentHash);
    document.getElementById("sign-document-status").innerText =
      "Документ подписан";
  } catch (err) {
    document.getElementById("sign-document-status").innerText =
      "Ошибка: " + err.message;
  }
}

async function checkSignatures() {
  const fileInput = document.getElementById("file-input");
  const documentHash = await calculateDocumentHash(fileInput);

  try {
    const [signers, signedStatus] = await contractInstance.getSignersStatus(
      documentHash
    );
    let signaturesHTML = "Подписи:<br>";

    for (let i = 0; i < signers.length; i++) {
      signaturesHTML += `${signers[i]}: ${
        signedStatus[i] ? "Подписан" : "Не подписан"
      }<br>`;
    }

    document.getElementById("signatures").innerHTML = signaturesHTML;
  } catch (err) {
    document.getElementById("signatures").innerText = "Ошибка: " + err.message;
  }
}

async function calculateDocumentHash(fileInput) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const fileBuffer = new Uint8Array(fileReader.result);
      const documentHash = ethers.utils.keccak256(fileBuffer);
      resolve(documentHash);
    };

    fileReader.onerror = function () {
      reject("Ошибка чтения файла");
    };

    fileReader.readAsArrayBuffer(fileInput.files[0]);
  });
}

async function addSigner() {
  if (!currentDocumentHash) {
    document.getElementById("add-signer-status").innerText =
      "Сначала загрузите файл";
    return;
  }

  const signersInput = document.getElementById("signers-input").value;
  const signers = signersInput.split(",").map((s) => s.trim());

  try {
    await contractInstance.addDocument(currentDocumentHash, signers);
    document.getElementById("add-signer-status").innerText =
      "Подписант добавлен";
  } catch (err) {
    document.getElementById("add-signer-status").innerText =
      "Ошибка: " + err.message;
  }
}

// Вешаем обработчики событий

document.getElementById("file-input").addEventListener("change", async () => {
  const fileInput = document.getElementById("file-input");
  const documentHash = await calculateDocumentHash(fileInput);
  document.getElementById("file-hash").innerText = "Хеш файла: " + documentHash;
});

document
  .getElementById("sign-document")
  .addEventListener("click", signDocument);
document
  .getElementById("check-signatures")
  .addEventListener("click", checkSignatures);

let currentDocumentHash;

document.getElementById("file-input").addEventListener("change", async () => {
  const fileInput = document.getElementById("file-input");
  currentDocumentHash = await calculateDocumentHash(fileInput);
  document.getElementById("file-hash").innerText =
    "Хеш файла: " + currentDocumentHash;
});

document.getElementById("add-signer").addEventListener("click", addSigner);

// Инициализация
init();
