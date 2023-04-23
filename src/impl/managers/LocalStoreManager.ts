import {singleton} from "tsyringe";

@singleton()
export class LocalStoreManager {

    private readonly KEY = "HIDE_FILE_MANAGER";

    public async setHash(hash: string): Promise<void> {
        const storedHash = await this.getItm();
        if (!storedHash) {
            await this.setItm([hash]);
        } else {
            storedHash.push(hash);
            await this.setItm(storedHash);
        }
    }

    public getAllHashes(): Promise<string[] | null> {
        return this.getItm();
    }

    public async hashHash(hash: string): Promise<boolean> {
        const allHashes = await this.getAllHashes();
        return allHashes?.includes(hash) ?? false;
    }

    private async getItm(): Promise<string[] | null> {
        const itmJson = await GM.getValue(this.KEY) as string;
        if (!itmJson) {
            return null;
        }
        return JSON.parse(itmJson);
    }

    private async setItm(itm: string[]): Promise<void> {
        const json = JSON.stringify(itm);
        await GM.setValue(this.KEY, json);
    }
}
