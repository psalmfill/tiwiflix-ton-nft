import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender_address = provider.sender().address as Address;
    
    const mintPrice = Number(toNano('0.1')); // Set the initial mint price to 0.1 TON

    // Compile and open the NFT collection
    const nftCollection = provider.open(
        NftCollection.createFromConfig(
            {
                ownerAddress: sender_address,
                nextItemIndex: 0,
                collectionContentUrl: 'https://psalmfill.github.io/tiwiflix-ton-nft/collection.json',
                commonContentUrl: 'https://psalmfill.github.io/tiwiflix-ton-nft',
                nftItemCode: await compile('NftItem'),
                royaltyParams: {
                    factor: 10,
                    base: 100,
                    address: sender_address,
                },
                mintPrice, // Set the mint price in the configuration
            },
            await compile('NftCollection'),
        ),
    );

    // Deploy the NFT collection
    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));

    // Wait for the contract to be deployed
    await provider.waitForDeploy(nftCollection.address);

    console.log('NFT Collection deployed at:', nftCollection.address.toString());

    // // Optional: Set the mint price after deployment
    // await nftCollection.sendChangeMintPrice(provider.sender(), {
    //     value: toNano('0.02'), // Gas fee for changing the price
    //     queryId: Date.now(), // Unique query ID
    //     newMintPrice: mintPrice, // Set the mint price
    // });

    // console.log('Mint price set to:', mintPrice.toString());

    // // Get and log the collection data
    // const data = await nftCollection.getCollectionData();
    // console.log('Collection data:', data);

    // // Get and log the current mint price
    // const currentMintPrice = await nftCollection.getMintPrice();
    // console.log('Current mint price:', currentMintPrice.toString());
}
