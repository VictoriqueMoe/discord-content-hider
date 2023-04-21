import {container, singleton} from "tsyringe";
import {PostConstruct} from "../decorators/PostConstruct";
import {DiscordType, Observable} from "../decorators/DiscordMessageEvent";
import type constructor from "tsyringe/dist/typings/types/constructor";

type ObserverRunnable = {
    method: Observable,
    context: constructor<unknown>
}

@singleton()
export class DiscordMutatorProxy {

    private readonly observerList: Map<DiscordType, ObserverRunnable[]> = new Map();

    private observerProxy: MutationObserver;

    @PostConstruct
    public async init(): Promise<void> {
        await this.onMessage();
        await this.onContextMenu();
    }

    private async onMessage(): Promise<void> {
        const elm = await this.waitForElm('[data-list-id="chat-messages"]');
        this.observerProxy = new MutationObserver((mutations, observer) => {
            for (const observable of this.observerList.get(DiscordType.NEW_MESSAGE)) {
                const instanceContext = container.resolve(observable.context);
                observable.method.call(instanceContext, mutations, observer);
            }
        });
        this.observerProxy.observe(elm, {
            childList: true
        });
    }

    private async onContextMenu(): Promise<void> {
        const observer = new MutationObserver(mutations => {
            const filteredMutations = mutations.filter(mutation => {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const el = mutation.addedNodes[i] as HTMLElement;
                    const firstChild = el?.firstChild;
                    if (firstChild && firstChild instanceof HTMLElement) {
                        if (firstChild.className?.includes("menu")) {
                            return true;
                        }
                    }
                }
                return false;
            });
            if (filteredMutations.length > 0) {
                for (const observable of this.observerList.get(DiscordType.ON_CONTEXT_MENU)) {
                    const instanceContext = container.resolve(observable.context);
                    observable.method.call(instanceContext, filteredMutations, observer);
                }
            }
        });
        observer.observe(document, {subtree: true, childList: true});
    }

    public addObserver(context: constructor<unknown>, type: DiscordType, method: Observable): void {
        const obj: ObserverRunnable = {
            method,
            context
        };
        if (this.observerList.has(type)) {
            this.observerList.get(type).push(obj);
        } else {
            this.observerList.set(type, [obj]);
        }

    }

    private waitForElm(selector: string): Promise<Element> {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
}
