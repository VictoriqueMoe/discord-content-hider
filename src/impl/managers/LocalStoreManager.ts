import {singleton} from "tsyringe";

@singleton()
export class LocalStoreManager {

    private readonly KEY = "HIDE_FILE_MANAGER";

    public setHash(hash: string): void {
        const storedHash = this.getItm();
        if (!storedHash) {
            this.setItm([hash]);
        } else {
            storedHash.push(hash);
            this.setItm(storedHash);
        }
    }

    public getAllHashes(): string[] | null {
        return this.getItm();
    }

    public hashHash(hash: string): boolean {
        return this.getAllHashes()?.includes(hash) ?? false;
    }

    private getItm(): string[] | null {
        const itmJson = window.localStorage.getItem(this.KEY);
        if (!itmJson) {
            return null;
        }
        return JSON.parse(itmJson);
    }

    private setItm(itm: string[]): void {
        const json = JSON.stringify(itm);
        window.localStorage.setItem(this.KEY, json);
    }
}
