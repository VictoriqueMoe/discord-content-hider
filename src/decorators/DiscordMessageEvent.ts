import {container} from "tsyringe";
import {DiscordMutatorProxy} from "../impl/DiscordMutatorProxy";

export enum DiscordType {
    NEW_MESSAGE,
    ON_CONTEXT_MENU
}

export type Observable = (mutationList: MutationRecord[], observer: MutationObserver) => void;

export function DiscordMessageEvent(type: DiscordType) {
    return function (target: any, propertyKey: string) {
        const mutatorProxy = container.resolve(DiscordMutatorProxy);
        const method: Observable = target[propertyKey] as Observable;
        const targetConstructor = target.constructor;
        mutatorProxy.addObserver(targetConstructor, type, method);
    }
}
