import {singleton} from "tsyringe";
import {DiscordMutatorProxy} from "./DiscordMutatorProxy";

@singleton()
export class PageInterceptor {
    public constructor(private _discordMutatorProxy: DiscordMutatorProxy) {

    }

    public async pageChange(callBack: (mutation: MutationRecord) => void): Promise<void> {
        window.addEventListener("load", ev => {
            let oldHref = document.location.href;
            const body = document.querySelector("body");
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (oldHref !== document.location.href) {
                        oldHref = document.location.href;
                        this._discordMutatorProxy.init();
                        callBack(mutation);
                    }
                }
            });
            observer.observe(body, {childList: true, subtree: true});
        }, true);
    }
}
