import 'reflect-metadata';
import {container, singleton} from "tsyringe";
import {DiscordMessageEvent, DiscordType} from "./decorators/DiscordMessageEvent";
import {PostConstruct} from "./decorators/PostConstruct";
import {PageInterceptor} from "./impl/PageInterceptor";
import {AttachmentsManager} from "./impl/AttachmentsManager";
import {UiBuilder} from "./impl/UiBuilder";

@singleton()
class DiscordChatObserver {

    public constructor(private _attachmentsManager: AttachmentsManager, private _uiBuilder: UiBuilder) {
        _uiBuilder.injectContent();
    }

    public removeElm(elms: Element[]): void {
        for (let elm of elms) {
            (elm as HTMLElement).style.display = "none";
        }
    }

    @DiscordMessageEvent(DiscordType.NEW_MESSAGE)
    public messageSent(mutationList: MutationRecord[], observer: MutationObserver): void {
        const removedElements = mutationList.map(mutationRecord => mutationRecord.removedNodes);
    }

    @DiscordMessageEvent(DiscordType.ON_CONTEXT_MENU)
    public contextMenuCalled(mutationList: MutationRecord[], observer: MutationObserver): void {
        const contextMenu = mutationList[0].addedNodes[0] as HTMLDivElement;
        const mainGroup: HTMLElement = contextMenu.querySelector(`[role="group"]:nth-child(2)`);
        if (!mainGroup) {
            return;
        }
        const option = this._uiBuilder.buildHideImageButton(mainGroup);
        if (!option) {
            return;
        }

        const messages = document.querySelector(`[data-list-id="chat-messages"]`);
        const selectedMessage = messages.querySelector(`[class*="selected"]`);
        if (!selectedMessage) {
            return;
        }
        const attachmentWrapper = selectedMessage.querySelector('[id*="message-accessories-"]');
        const attachments = attachmentWrapper.querySelectorAll(`[class^="messageAttachment"]`);
        if (!attachments || attachments.length === 0) {
            return;
        }

        mainGroup.append(option);
        option.addEventListener("click", ev => {
            const attachmentUrls = this._attachmentsManager.gatAttachments(attachmentWrapper);
            console.log(attachmentUrls);
        });

        option.addEventListener("mouseenter", ev => {
            const selectedEl = mainGroup.parentNode.querySelector(`[class*="focused"]`);
            if (selectedEl) {
                const classList = selectedEl.classList;
                let selectedClassName = null;
                for (let i = 0; i < classList.length; i++) {
                    const classItem = classList[i];
                    if (classItem.includes("focused")) {
                        selectedClassName = classItem;
                        break;
                    }
                }
                if (selectedClassName) {
                    classList.remove(selectedClassName);
                }
            }
        });

    }

    @PostConstruct
    private async init(): Promise<void> {
        const pageInterceptor = container.resolve(PageInterceptor);
        await pageInterceptor.pageChange(() => {
            const chatContainer = document.querySelector('[data-list-id="chat-messages"]');
            const toRemove: Element[] = [];
            for (let i = 0; i < chatContainer.children.length; i++) {
                const chatItem = chatContainer.children[i];
                const isBlockedMessage = chatItem.querySelector('[class^="blockedSystemMessage"]') !== null;
                if (isBlockedMessage) {
                    toRemove.push(chatItem);
                }
            }
            this.removeElm(toRemove);
        });
    }
}

container.resolve(DiscordChatObserver);
