// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockedToken is ERC20 {
    constructor() public ERC20("Mocked Token", "MCK")
    {
        _mint(msg.sender, 10 ** 18);
    }
}
