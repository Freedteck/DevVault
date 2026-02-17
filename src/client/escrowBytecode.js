const bytecode = "6080604052348015600e575f5ffd5b50600180546001600160a01b031916331790556106138061002e5f395ff3fe608060405260043610610054575f3560e01c8063012f52ee1461005857806312065fe0146100f05780637d19e5961461010a5780638124fea61461018c5780638da5cb5b146101ad578063b6b55f25146101e4575b5f5ffd5b348015610063575f5ffd5b506100b061007236600461058d565b5f6020819052908152604090208054600182015460028301546003909301546001600160a01b03928316939192821691600160a01b900460ff169085565b604080516001600160a01b0396871681526020810195909552929094169183019190915215156060820152608081019190915260a0015b60405180910390f35b3480156100fb575f5ffd5b506040514781526020016100e7565b348015610115575f5ffd5b506100b061012436600461058d565b5f9081526020818152604091829020825160a08101845281546001600160a01b0390811680835260018401549483018590526002840154918216958301869052600160a01b90910460ff16151560608301819052600390930154608090920182905294929392565b348015610197575f5ffd5b506101ab6101a63660046105a4565b6101f7565b005b3480156101b8575f5ffd5b506001546101cc906001600160a01b031681565b6040516001600160a01b0390911681526020016100e7565b6101ab6101f236600461058d565b61040e565b6001546001600160a01b031633146102605760405162461bcd60e51b815260206004820152602160248201527f4f6e6c79206f776e65722063616e2063616c6c20746869732066756e6374696f6044820152603760f91b60648201526084015b60405180910390fd5b5f82815260208190526040902060018101546102c85760405162461bcd60e51b815260206004820152602160248201527f4e6f20657363726f7720666f756e6420666f722074686973207175657374696f6044820152603760f91b6064820152608401610257565b6002810154600160a01b900460ff16156103245760405162461bcd60e51b815260206004820152601760248201527f457363726f7720616c72656164792072656c65617365640000000000000000006044820152606401610257565b6001600160a01b03821661036e5760405162461bcd60e51b8152602060048201526011602482015270125b9d985b1a59081c9958da5c1a595b9d607a1b6044820152606401610257565b6002810180546001600160a81b0319166001600160a01b038416908117600160a01b17909155600182015460405181156108fc0291905f818181858888f193505050501580156103c0573d5f5f3e3d5ffd5b50816001600160a01b0316837f3bfce8de0db7450cc169b94323c210e69a36c6a4a58c9f5d96bec4973adce392836001015460405161040191815260200190565b60405180910390a3505050565b5f34116104565760405162461bcd60e51b815260206004820152601660248201527526bab9ba103232b837b9b4ba1039b7b6b290242120a960511b6044820152606401610257565b5f81815260208190526040902060010154156104c45760405162461bcd60e51b815260206004820152602760248201527f457363726f7720616c72656164792065786973747320666f72207468697320716044820152663ab2b9ba34b7b760c91b6064820152608401610257565b6040805160a081018252338082523460208084018281525f8587018181526060870182815242608089019081528a84529483905291889020965187546001600160a01b039182166001600160a01b0319909116178855925160018801555160028701805492511515600160a01b026001600160a81b0319909316919093161717905551600390930192909255915183917f1599c0fcf897af5babc2bfcf707f5dc050f841b044d97c3251ecec35b9abf80b9161058291815260200190565b60405180910390a350565b5f6020828403121561059d575f5ffd5b5035919050565b5f5f604083850312156105b5575f5ffd5b8235915060208301356001600160a01b03811681146105d2575f5ffd5b80915050925092905056fea2646970667358221220b0d505e001e2d4ae0748a4583a6bef3199731d7e52143710dc872b689559da2564736f6c634300081e0033";
const abi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "depositor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Released",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "escrows",
    "outputs": [
      {
        "internalType": "address",
        "name": "depositor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "released",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      }
    ],
    "name": "getEscrow",
    "outputs": [
      {
        "internalType": "address",
        "name": "depositor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "released",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "release",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export { bytecode, abi };