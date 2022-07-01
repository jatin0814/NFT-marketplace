let { expect } = require("chai");
// const { ethers } = require("hardhat");
// ethers.utils.parseEther
const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function () {

    let feePercent = 1, nft, marketplace, deployer, addr1, addr2;
    let tokenURI = "Sample URI";
    beforeEach(async function () {
        const NFT = await ethers.getContractFactory("NFT");
        const Marketplace = await ethers.getContractFactory("Marketplace");
        [deployer, addr1, addr2] = await ethers.getSigners();
        nft = await NFT.deploy();
        marketplace = await Marketplace.deploy(feePercent);
    });

    describe("Deployment", function () {
        it("Should track name and symbol of nft", async function () {
            expect(await nft.name()).to.equal("TEST NFT");
            expect(await nft.symbol()).to.equal("TNFT");
        })
        it("Should track feeAccount and feePrecent of the marketplace", async function () {
            expect(await marketplace.feeAccount()).to.equal(deployer.address);
            expect(await marketplace.feePercent()).to.equal(feePercent);
        })
    })


    describe("NFT minting", function () {
        it("should track minting NFT", async function () {
            await nft.connect(addr1).mint(tokenURI);
            expect(await nft.tokenCount()).to.equals(1);
            expect(await nft.balanceOf(addr1.address)).to.equals(1);
            expect(await nft.tokenURI(1)).to.equals(tokenURI);

            await nft.connect(addr2).mint(tokenURI);
            expect(await nft.tokenCount()).to.equals(2);
            expect(await nft.balanceOf(addr2.address)).to.equals(1);
            expect(await nft.tokenURI(2)).to.equals(tokenURI);

        })
    });

    describe("Making marketplace Item", function () {
        beforeEach(async function () {
            await nft.connect(addr1).mint(tokenURI);
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
        })

        it("should track newly created item, transfer NFT from seller to marketplace, and emit offered event", async function () {
            await expect(await marketplace.connect(addr1).makeItem(1, nft.address, toWei(1))).to.emit(marketplace, "offered").withArgs(
                1,
                nft.address,
                1,
                toWei(1),
                addr1.address
            )

            expect(await nft.ownerOf(1)).to.equals(marketplace.address);
            expect(await marketplace.itemcount()).to.equals(1);
        });
        //await marketplace.makeItem(1, nft.address, 1);
        it("should failed when price is 0", async function () {
            await expect(
                marketplace.connect(addr1).makeItem(1, nft.address, 0)
            ).to.be.revertedWith("Price should pe greater than 0");
        });

    })

    describe("Purchasing marketplace Item", async function(){
        let price = 2;
        beforeEach(async function(){

            await nft.connect(addr1).mint(tokenURI);
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
            await expect(await marketplace.connect(addr1).makeItem(1, nft.address, toWei(price)));
        })

        it("Item sold, pay seller, transfer nft to new user, transfer fee to feeAccount and emit bought event", async function(){
            const sellerInitialEthBal = await addr1.getBalance()
            const feeAccountInitialEthBal = await deployer.getBalance()

            let totalPrice = await marketplace.getTotalPrice(1);

            await expect(await marketplace.connect(addr2).purchaseItem(1, {value: totalPrice})).to.emit(marketplace, "bought").withArgs(
                1,
                nft.address,
                1,
                toWei(price),
                addr1.address,
                addr2.address
            )

            const sellerFinalEthBal = await addr1.getBalance()
            const feeAccountFinalEthBal = await deployer.getBalance()

            expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitialEthBal));
            expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fromWei(totalPrice) - +price + +fromWei(feeAccountInitialEthBal));

            expect(await nft.ownerOf(1)).to.equal(addr2.address);
            expect((await marketplace.items(1)).sold).to.equal(true);
        })

        it("should fail for invalid item ids, sold items and when not enough paid", async function(){
            let totalPrice = await marketplace.getTotalPrice(1);
            expect(marketplace.connect(addr2).purchaseItem(2, {value: totalPrice})).to.revertedWith("Item not exists!");
            expect(marketplace.connect(addr2).purchaseItem(1, {value: 0})).to.revertedWith("Value is higher than you sent");
            await expect(await marketplace.connect(addr2).purchaseItem(1, {value: totalPrice}));
            expect(marketplace.connect(addr2).purchaseItem(1, {value: totalPrice})).to.revertedWith("item is already sold");
        })
    })
})