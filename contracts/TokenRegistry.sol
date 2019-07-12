pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TokenRegistry is Ownable {
    struct Token {
        address contractAddress;
        string symbol;
        string name;
        uint8 decimals;
        uint16 flags;
    }

    mapping(address => bool) public registry;

    event TokenRegistered(address indexed contractAddress, Token info);

    function register(Token calldata token) external onlyOwner {
        require(token.contractAddress != address(0));
        require(bytes(token.symbol).length > 0);
        require(bytes(token.name).length > 0);
        require(token.decimals >= 0 && token.decimals <= 18);
        require(!registry[token.contractAddress]);

        registry[token.contractAddress] = true;

        emit TokenRegistered(token.contractAddress, token);
    }
}
