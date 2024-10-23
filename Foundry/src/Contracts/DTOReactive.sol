// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.0;

import "IReactive.sol";
import "ISubscriptionService.sol";
import "AbstractReactive.sol";

contract DTOReactive is IReactive, AbstractReactive {
    uint256 private constant KOPLI_CHAIN_ID = 5318008;
    uint256 private constant LOAN_FULLYREPAID_TOPIC_0 = 0x59bd56f70adeefb0cd83dca0f34f066bed6ee442068f3d07b5fc974b944d5aa6;
    uint256 private constant LOAN_LIQUIDATED_TOPIC_0 = 0xd75168f1c9346a6c18eaeba0d3c95ea70b5dc2c0c280274a670c97cb8e4f415b;

    uint64 private constant CALLBACK_GAS_LIMIT = 1000000;

    address private l1;

    constructor(address ORIGIN_ADDRESS, address _l1) {
        bytes memory payload1 = abi.encodeWithSignature(
            "subscribe(uint256,address,uint256,uint256,uint256,uint256)",
            KOPLI_CHAIN_ID,
            ORIGIN_ADDRESS,
            LOAN_FULLYREPAID_TOPIC_0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        (bool subscription_result1,) = address(service).call(payload1);
        if (!subscription_result1) {
            vm = true;
        }
          bytes memory payload2 = abi.encodeWithSignature(
            "subscribe(uint256,address,uint256,uint256,uint256,uint256)",
            KOPLI_CHAIN_ID,
            ORIGIN_ADDRESS,
            LOAN_LIQUIDATED_TOPIC_0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        (bool subscription_result2,) = address(service).call(payload2);
        if (!subscription_result2) {
            vm = true;
        }

        l1 = _l1;
    }

    receive() external payable {}

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
        if (topic_0 == LOAN_FULLYREPAID_TOPIC_0) {
            bytes memory payload = abi.encodeWithSignature(
                "releaseCollateral(address,address)",
                address(0),
                address(uint160(topic_1))
            );
            emit Callback(11155111,l1, CALLBACK_GAS_LIMIT, payload);
        } 
        if(topic_0 == LOAN_LIQUIDATED_TOPIC_0){
            bytes memory payload = abi.encodeWithSignature(
                 "liquidateLoan(address,address)",
                address(0),
                address(uint160(topic_1))
             );
             emit Callback(11155111, l1, CALLBACK_GAS_LIMIT, payload);
        }
    }
}