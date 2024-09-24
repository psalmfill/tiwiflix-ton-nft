import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { decodeOffChainContent, encodeOffChainContent } from './metadata';

export const Opcodes = {
    getRoyaltyParams: 0x693d3950,
    mint: 1,
    batchMint: 2,
    changeOwner: 3,
    changeMintPrice: 4, // New opcode for updating mint price
};

export type RoyaltyParams = {
    factor: number;
    base: number;
    address: Address;
};

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    collectionContentUrl: string;
    commonContentUrl: string;
    nftItemCode: Cell;
    royaltyParams: RoyaltyParams;
    mintPrice: number; // Add mint price
};

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    const content = beginCell()
        .storeRef(encodeOffChainContent(config.collectionContentUrl))
        .storeRef(beginCell().storeBuffer(Buffer.from(config.commonContentUrl)).endCell())
        .endCell();
    const royaltyParams = beginCell()
        .storeUint(config.royaltyParams.factor, 16)
        .storeUint(config.royaltyParams.base, 16)
        .storeAddress(config.royaltyParams.address)
        .endCell();

    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(content)
        .storeRef(config.nftItemCode)
        .storeRef(royaltyParams)
        .storeUint(config.mintPrice, 64) // Store mint price
        .endCell();
}

export class NftCollection implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendGetRoyaltyParams(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcodes.getRoyaltyParams, 32).storeUint(opts.queryId, 64).endCell(),
        });
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId: number;
            coinsForStorage: bigint;
            ownerAddress: Address;
            content: string;
            index: number;
        },
    ) {
        const nftItemContent = beginCell();
        nftItemContent.storeAddress(opts.ownerAddress);

        const uriContent = beginCell();
        uriContent.storeBuffer(Buffer.from(opts.content));
        nftItemContent.storeRef(uriContent.endCell());

        await provider.internal(via, {
            value: opts.value, // Ensure this includes the mint price
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.mint, 32)
                .storeUint(opts.queryId, 64)
                .storeUint(opts.index, 64)
                .storeCoins(opts.coinsForStorage)
                .storeRef(nftItemContent)
                .endCell(),
        });
    }

    async sendBatchMint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcodes.batchMint, 32).storeUint(opts.queryId, 64).endCell(),
        });
    }

    async sendChangeMintPrice(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId: number;
            newMintPrice: number;
        },
    ) {
        return await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.changeMintPrice, 32)
                .storeUint(opts.queryId, 64)
                .storeUint(opts.newMintPrice, 64) // Update mint price
                .endCell(),
        });
    }

    async sendChangeOwner(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId: number;
            newOwnerAddress: Address;
        },
    ) {
        return await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.changeOwner, 32)
                .storeUint(opts.queryId, 64)
                .storeAddress(opts.newOwnerAddress) // Update mint price
                .endCell(),
        });
    }

    async getMintingPrice(provider: ContractProvider): Promise<number> {
        const { stack } = await provider.get('get_minting_price', []);
        return stack.readNumber(); // Return mint price
    }

    async getCollectionData(provider: ContractProvider): Promise<{
        nextItemIndex: number;
        collectionContentUrl: string;
        ownerAddress: Address;
    }> {
        const { stack } = await provider.get('get_collection_data', []);

        return {
            nextItemIndex: stack.readNumber(),
            collectionContentUrl: decodeOffChainContent(stack.readCell()),
            ownerAddress: stack.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: bigint): Promise<Address> {
        const { stack } = await provider.get('get_nft_address_by_index', [
            {
                type: 'int',
                value: index,
            },
        ]);

        return stack.readAddress();
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<RoyaltyParams> {
        const { stack } = await provider.get('royalty_params', []);

        return {
            factor: stack.readNumber(),
            base: stack.readNumber(),
            address: stack.readAddress(),
        };
    }

    async getNftContent(provider: ContractProvider, index: bigint, individualNftContent: Cell): Promise<string> {
        const { stack } = await provider.get('get_nft_content', [
            {
                type: 'int',
                value: index,
            },
            {
                type: 'cell',
                cell: individualNftContent,
            },
        ]);

        return decodeOffChainContent(stack.readCell());
    }
}
