// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import "IReactive.sol";
import "ISubscriptionService.sol";
import "AbstractReactive.sol";

contract OTDReactive is IReactive, AbstractReactive {
    uint256 private constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 private constant LOAN_REQUESTED_TOPIC_0 = 0x0704a1857a9b5b67db03e3063b041ea8957938899600063ec186c920b4298985;
    uint256 private constant LOAN_INITIATED_TOPIC_0 = 0x9f79890befae633b2d1f6eec055b69d4c79559e4c129c343bb87c5eea38cdd70;

    uint64 private constant CALLBACK_GAS_LIMIT = 1000000;

    address private l1;

    constructor(address ORIGIN_ADDRESS, address _l1) {
        _subscribe(ORIGIN_ADDRESS);
        l1 = _l1;
    }

    receive() external payable {}

    function _subscribe(address ORIGIN_ADDRESS) private {
        bytes memory payload = abi.encodeWithSignature(
            "subscribe(uint256,address,uint256,uint256,uint256,uint256)",
            SEPOLIA_CHAIN_ID,
            ORIGIN_ADDRESS,
            LOAN_REQUESTED_TOPIC_0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        (bool success,) = address(service).call(payload);
        if (!success) {
            vm = true;
        }

        bytes memory payload1 = abi.encodeWithSignature(
            "subscribe(uint256,address,uint256,uint256,uint256,uint256)",
            SEPOLIA_CHAIN_ID,
            ORIGIN_ADDRESS,
            LOAN_INITIATED_TOPIC_0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        (bool success1,) = address(service).call(payload1);
        if (!success1) {
            vm = true;
        }
    }

    function react(
        uint256 chain_id,
        address _contract,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 topic_3,
        bytes calldata data,
        uint256 /* block number */,
        uint256 /* op_code */
    ) external vmOnly {
        if (topic_0 == LOAN_REQUESTED_TOPIC_0) {
                
         bytes memory payload = abi.encodeWithSignature(
            "requestLoan(address,address,uint256,uint256,uint256,uint256)",
            address(0),
            address(uint160(topic_1)),
            topic_2,
            800,
            topic_3,
            88
        );
        emit Callback(5318008, l1, CALLBACK_GAS_LIMIT, payload);
        } else if (topic_0 == LOAN_INITIATED_TOPIC_0) {
            bytes memory payload = abi.encodeWithSignature(
                "fundLoan(address,address)",
                address(0),
                topic_1
            );
            emit Callback(5318008, l1, CALLBACK_GAS_LIMIT, payload);
        }
    }

}