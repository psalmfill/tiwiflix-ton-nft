import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('NftCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection'); // Compile the contract
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftCollection: SandboxContract<NftCollection>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const mintPrice = Number(toNano('0.1')); // Set the initial mint price to 0.1 TON

        // Set up deployer
        deployer = await blockchain.treasury('deployer');
        // Open the compiled contract on the blockchain
        nftCollection = blockchain.openContract(
            NftCollection.createFromConfig(
                {
                    ownerAddress: deployer.address,
                    nextItemIndex: 0,
                    collectionContentUrl: 'https://psalmfill.github.io/tiwiflix-ton-nft/collection.json',
                    commonContentUrl: 'https://psalmfill.github.io/tiwiflix-ton-nft',
                    nftItemCode: await compile('NftItem'),
                    royaltyParams: {
                        factor: 10,
                        base: 100,
                        address: deployer.address,
                    },
                    mintPrice, // Set the mint price in the configuration
                },
                code,
            ),
        );

        // Deploy the contract
        const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.05'));

        // Ensure contract is deployed successfully
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });
    });

    // Test case 1: Verify contract deployment
    it('should deploy successfully', async () => {
        // Checks are already done in the beforeEach
    });

    // Test case 2: Get collection data
    it('should return correct collection data', async () => {
        const collectionData = await nftCollection.getCollectionData();
        console.log(collectionData, deployer.address);
        // expect(collectionData).toBeTruthy();
        expect(collectionData.ownerAddress.toString()).toBe(deployer.address.toString());
        expect(collectionData.nextItemIndex.toString()).toBe('0'); // next_item_index starts at 0
        // Add checks for collection content, owner, etc.
    });

    // Test case 3: Mint a new NFT
    it('should mint a new NFT', async () => {
        const mintFee = toNano('0.1');
        const nftContent = new Cell(); // Add any necessary NFT content
        const data = await nftCollection.getCollectionData();

        // Send a message to mint a new NFT
        const mintResult = await nftCollection.sendMint(deployer.getSender(), {
            index: data.nextItemIndex,
            value: toNano('0.05') + mintFee,
            queryId: Date.now(),
            coinsForStorage: toNano('0.05') + mintFee,
            ownerAddress: deployer.address,
            content: '/nft.json',
        });
        console.log(mintResult);

        // Ensure the minting transaction is successful
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            success: true,
        });

        // Verify next_item_index has incremented
        const collectionData = await nftCollection.getCollectionData();
        expect(collectionData.nextItemIndex.toString()).toBe('1'); // next_item_index should now be 1
    });

    // Test case 4: Update minting price
    it('should update minting price', async () => {
        const newMintingPrice = Number(toNano('0.2'));

        // Send a message to update the minting price
        const updatePriceResult = await nftCollection.sendChangeMintPrice(deployer.getSender(), {
            value: toNano('0.01'),
            queryId: Date.now(),
            newMintPrice: newMintingPrice,
        });

        // Ensure transaction is successful
        expect(updatePriceResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            success: true,
        });

        // Verify minting price has been updated
        const mintingPrice = await nftCollection.getMintingPrice();
        expect(mintingPrice.toString()).toBe(newMintingPrice.toString());
    });

    it('should update owner address', async () => {

        // Send a message to update the minting price
        const updatePriceResult = await nftCollection.sendChangeOwner(deployer.getSender(), {
            value: toNano('0.01'),
            queryId: Date.now(),
            newOwnerAddress: deployer.address ,
        });

        // Ensure transaction is successful
        expect(updatePriceResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            success: true,
        });

        // Verify collection data has been updated
        const collectionData = await nftCollection.getCollectionData();
        expect(collectionData.ownerAddress.toString()).toBe(deployer.address.toString());
    });

    // Test case 5: Batch deploy NFTs
    // it('should batch deploy NFTs', async () => {
    //     const nftContent = new Cell(); // Add any necessary NFT content
    //     const amount = toNano('0.1');

    //     // Call batch_deploy_nft_item for multiple NFTs
    //     const batchDeployResult = await nftCollection.send('batch_deploy_nft_item', deployer.getSender(), {
    //         value: amount,
    //         bounce: false,
    //         body: new Cell() // Pass a cell with details for batch NFT deploy
    //     });

    //     // Ensure the transaction is successful
    //     expect(batchDeployResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: nftCollection.address,
    //         success: true,
    //     });

    //     // Verify next_item_index has incremented for batch deployment
    //     const collectionData = await nftCollection.get('get_collection_data');
    //     expect(collectionData[0].toString()).toBeGreaterThan('1'); // Adjust depending on batch size
    // });

    // Test case 6: Get royalty parameters
    it('should return royalty parameters', async () => {
        const royaltyParams = await nftCollection.getRoyaltyParams();
        const data = await nftCollection.getCollectionData();

        // Ensure royalty parameters are returned correctly
        expect(royaltyParams).toBeTruthy();
        expect(royaltyParams.base.toString()).toBe('100'); // Example: royalty base
        expect(royaltyParams.factor.toString()).toBe('10'); // Example: royalty factor
        // Verify royalty address as well
    });

    // Test case 7: Get NFT address by index
    it('should return correct NFT address by index', async () => {
        const nftAddress = await nftCollection.getNftAddressByIndex(0n);

        // Ensure NFT address is returned correctly
        expect(nftAddress).toBeTruthy();
    });

    // Test case 8: Handle incorrect minting price (error case)
    it('should fail if minting price is too low', async () => {
        const mintFee = toNano('0.05'); // Too low
        const nftContent = new Cell();
        const data = await nftCollection.getCollectionData();

        const mintResult = await nftCollection.sendMint(deployer.getSender(), {
            index: data.nextItemIndex,
            value: toNano('0.05') + mintFee,
            queryId: Date.now(),
            coinsForStorage: toNano('0.05'),
            ownerAddress: deployer.address,
            content: '/nft.json',
        });

        // Ensure the transaction failed
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            success: false, // Should fail
        });
    });
});
