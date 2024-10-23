# Cross-Chain Lending Protocol

## Overview

The **Cross-Chain Lending Protocol** enables users to deposit ETH collateral on Ethereum Sepolia and receive MATIC loans on KOPLI through the Reactive Network. The protocol features:

- **Collateral Management:** Lock ETH on Ethereum Sepolia as loan collateral
- **Cross-Chain Lending:** Receive MATIC loans on KOPLI network
- **Reactive Bridge Integration:** Secure cross-chain communication via Reactive Network
- **Automated Liquidations:** LTV monitoring and liquidation process
- **Price Oracle Integration:** Real-time collateral valuation using Chainlink feeds

## Prerequisites

Before you begin, make sure you have:

- [Foundry](https://book.getfoundry.sh/) installed
- Access to the following RPCs:
  * `SEPOLIA_RPC` — https://rpc2.sepolia.org
  * `REACTIVE_RPC` — https://kopli-rpc.rkt.ink
- Required environment variables in `.env`:
```
SEPOLIA_RPC=
SEPOLIA_PRIVATE_KEY=
REACTIVE_RPC=
REACTIVE_PRIVATE_KEY=
SEPOLIA_CALLBACK_PROXY_ADDR=0x33Bbb7D0a2F1029550B0e91f653c4055DC9F4Dd8
```

**Note**: To receive REACT tokens, send SepETH to the Reactive faucet on Ethereum Sepolia (`0x9b9BB25f1A81078C544C829c5EB7822d747Cf434`).

## Project Structure

```
src/
├── OriginContract.sol       # Ethereum Sepolia contract for collateral
├── DestinationContract.sol  # KOPLI contract for loan management
├── ReactiveContract.sol     # Cross-chain bridge contract
└── interfaces/
    ├── IOriginContract.sol
    ├── IDestinationContract.sol
    └── IReactiveContract.sol
```

## Installation

1. Clone the repository
```shell
git clone https://github.com/your-username/cross-chain-lending
cd cross-chain-lending
```

2. Install dependencies
```shell
forge install
```

3. Build the project
```shell
forge build
```

## Testing

Run the full test suite:
```shell
forge test
```

Run specific test file:
```shell
forge test --match-path test/OriginContract.t.sol -vvv
```

Generate gas report:
```shell
forge test --gas-report
```

## Deployment

Deploy contracts to respective networks:

### 1. Origin Contract (Sepolia)
```shell
forge script script/DeployOrigin.s.sol:DeployOrigin \
    --rpc-url $SEPOLIA_RPC \
    --private-key $SEPOLIA_PRIVATE_KEY \
    --broadcast
```

### 2. Reactive Bridge Contracts
```shell
forge script script/DeployReactive.s.sol:DeployReactive \
    --rpc-url $REACTIVE_RPC \
    --private-key $REACTIVE_PRIVATE_KEY \
    --broadcast
```

### 3. Destination Contract (KOPLI)
```shell
forge script script/DeployDestination.s.sol:DeployDestination \
    --rpc-url $REACTIVE_RPC \
    --private-key $REACTIVE_PRIVATE_KEY \
    --broadcast
```

## Contract Interaction

### Deposit Collateral
```shell
cast send $ORIGIN_CONTRACT_ADDR "depositCollateral()" \
    --rpc-url $SEPOLIA_RPC \
    --private-key $SEPOLIA_PRIVATE_KEY \
    --value 1ether
```

### Check Loan Status
```shell
cast call $DESTINATION_CONTRACT_ADDR "getLoanStatus(address)" \
    --rpc-url $REACTIVE_RPC \
    $BORROWER_ADDRESS
```

### Repay Loan
```shell
cast send $DESTINATION_CONTRACT_ADDR "repayLoan()" \
    --rpc-url $REACTIVE_RPC \
    --private-key $REACTIVE_PRIVATE_KEY \
    --value 1ether
```

## Development Commands

### Build
```shell
forge build
```

### Test
```shell
forge test
```

### Format
```shell
forge fmt
```

### Gas Snapshots
```shell
forge snapshot
```

### Local Testing
```shell
anvil
```

### Contract Verification
```shell
forge verify-contract $CONTRACT_ADDR \
    src/ContractName.sol:ContractName \
    $EXPLORER_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address)" $CONSTRUCTOR_ARG)
```

## Deployed Contracts

- Sepolia OriginContract: `0x590BEff93aF028D343Fd03e958d51C123f9aB7b6`
- Reactive Bridge Contract OTD: `0x55033f19F97b1c8d1dCA347Da2f5F5b955F4B828`
- Reactive Bridge Contract DTO: `0xd373C76D0922857E27556eFDAD4b39C475561C20`
- KOPLI DestinationContract: `0xF32c2c1cc9686D635f5D99ADb07E97a17877F134`

## Example Transactions

1. Loan Request (Sepolia): [0x4d2d94e6bb0349bde7796523fcafdda6fda321cec578708c33816b6607ecf2f4](https://sepolia.etherscan.io/tx/0x4d2d94e6bb0349bde7796523fcafdda6fda321cec578708c33816b6607ecf2f4)
2. Collateral Deposit (Sepolia): [0x7d6e40b7c144e63d09be250859874d9bff1d6e19ff3ea51ed86b8d61bc8f782c](https://sepolia.etherscan.io/tx/0x7d6e40b7c144e63d09be250859874d9bff1d6e19ff3ea51ed86b8d61bc8f782c)
3. Repay Loan (KOPLI): [0xa1b6181da7e2a9e89785a0290a84f498b6ab063689a9e9880255dfc726426f7b](https://kopli.reactscan.net/tx/0xa1b6181da7e2a9e89785a0290a84f498b6ab063689a9e9880255dfc726426f7b)

## Documentation

For detailed documentation on Foundry tools:
- Foundry Book: https://book.getfoundry.sh/
- Reactive Network Docs: https://dev.reactive.network/

## Security Considerations

- Monitor LTV ratios to avoid liquidation
- Ensure sufficient callback payment funds on Sepolia
- Regular verification of price feed data
- Access control for administrative functions