//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract Marketplace is ReentrancyGuard {
    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemcount;

    struct Item{
        uint itemId;
        uint tokenId;
        IERC721 nft;
        uint price;
        bool sold;
        address payable seller;
    }

    event offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );

     event bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    constructor(uint _feePercent){
        feePercent = _feePercent;
        feeAccount = payable(msg.sender);
    }

    mapping(uint => Item) public items;

    function makeItem(uint _tokenId, IERC721 _nft, uint _price) external nonReentrant {
        require(_price > 0, "Price should pe greater than 0");

        itemcount++;
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        items[itemcount] = Item(
            itemcount,
            _tokenId,
            _nft,
            _price,
            false,
            payable(msg.sender)
        );

        emit offered(itemcount, address(_nft), _tokenId, _price, msg.sender);
    }


    function purchaseItem(uint itemId) external payable nonReentrant {
        uint totalPrice = getTotalPrice(itemId);
        require(itemId > 0 && itemId <= itemcount, "Item not exists!");
        require(msg.value == totalPrice, "Value is higher than you sent");
        require(!items[itemId].sold, "item is already sold");

        Item storage item = items[itemId];
        item.seller.transfer(item.price);
        item.sold = true;
        feeAccount.transfer(totalPrice - item.price);
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);

        emit bought(itemId, address(item.nft), item.tokenId, item.price, item.seller, msg.sender);
    }

    function getTotalPrice(uint itemId) public view returns(uint){
        return (items[itemId].price*(100 + feePercent)/100);
    }
}
