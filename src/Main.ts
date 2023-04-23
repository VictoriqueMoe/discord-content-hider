import 'reflect-metadata';
import {container, singleton} from "tsyringe";
import {DiscordMessageEvent, DiscordType} from "./decorators/DiscordMessageEvent";
import {PostConstruct} from "./decorators/PostConstruct";
import {PageInterceptor} from "./impl/PageInterceptor";
import {AttachmentsManager} from "./impl/managers/AttachmentsManager";
import {UiBuilder} from "./impl/UiBuilder";
import {LocalStoreManager} from "./impl/managers/LocalStoreManager";
import {waitForElm} from "./Utils";

@singleton()
class DiscordChatObserver {

    private readonly MAX_CONTENT_SIZE = 10485760; // 10MB

    public constructor(private _attachmentsManager: AttachmentsManager,
                       private _uiBuilder: UiBuilder,
                       private _localStoreManager: LocalStoreManager) {
        _uiBuilder.injectContent();

        const myiframe = document.createElement("iframe");
        myiframe.onload = () => {
            window.localStorage = myiframe.contentWindow.localStorage;
        };
        myiframe.src = "about:blank";
        document.body.appendChild(myiframe);
    }

    public removeElm(elms: Element[]): void {
        for (let elm of elms) {
            (elm as HTMLElement).style.display = "none";
        }
    }

    @DiscordMessageEvent(DiscordType.NEW_MESSAGE)
    public async messageSent(mutationList: MutationRecord[], observer: MutationObserver): Promise<void> {
        const elmsToRemovePArray = mutationList.flatMap(async mutationRecord => {
            const retArr: Element[] = [];
            for (let i = 0; i < mutationRecord.addedNodes.length; i++) {
                const addedMessage = mutationRecord.addedNodes[i] as HTMLElement;
                if (await this.shouldRemove(addedMessage)) {
                    retArr.push(addedMessage)
                }
            }
            return retArr;
        });
        const elmsToRemove = await Promise.all(elmsToRemovePArray);
        this.removeElm(elmsToRemove.flat());
    }

    private async shouldRemove(el: HTMLElement): Promise<boolean> {
        const msgId = el.id;
        if (!msgId.includes("chat-messages")) {
            return false;
        }
        const attachmentWrapper = el.querySelector('[id*="message-accessories-"]');
        const attachments = attachmentWrapper.querySelectorAll(`[class^="messageAttachment"]`);
        if (!attachments || attachments.length === 0) {
            return false;
        }
        const attachmentUrls = this._attachmentsManager.gatAttachmentsUrls(attachmentWrapper);
        for (const attachmentUrl of attachmentUrls) {
            let fileSize: number;
            try {
                fileSize = await this._attachmentsManager.getAttachmentFileSize(attachmentUrl);
            } catch (e) {
                console.warn(e);
                continue;
            }
            if (fileSize > this.MAX_CONTENT_SIZE || fileSize < 0) {
                return false;
            }
            const hash = await this._attachmentsManager.getFileHash(attachmentUrl);
            if (this._localStoreManager.hashHash(hash)) {
                return true;
            }
        }
        return false;
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
        option.addEventListener("click", async ev => {
            if (this._uiBuilder.isLoading()) {
                return;
            }
            let proceed = false;
            let idx = 0;
            const attachmentUrls = this._attachmentsManager.gatAttachmentsUrls(attachmentWrapper);
            if (attachmentUrls.length > 1) {
                const index = prompt("This message has multiple attachments, please enter the number you wish to block");
                let num = Number.parseInt(index);
                if (Number.isNaN(num)) {
                    alert("Please enter only a number");
                    return;
                }
                num = num - 1;
                if (num < 0 || num > attachmentUrls.length) {
                    alert("Number can not be less than 1 or more than the amount of attachments this message has");
                    return;
                }
                idx = num;
            }
            proceed = confirm("are you sure you wish to hide every message containing this attachment?");
            if (!proceed) {
                return;
            }
            const urlToBlock = attachmentUrls[idx];
            let fileSize: number;

            try {
                fileSize = await this._attachmentsManager.getAttachmentFileSize(urlToBlock);
            } catch (e) {
                console.warn(e);
                return;
            }

            if (fileSize < 0) {
                alert("There was an unknown error in obtaining the size of the file");
                return;
            }

            if (fileSize > this.MAX_CONTENT_SIZE) {
                alert("the file is too large. this script needs to download the file to calculate the hash and the max file size is 10MB");
                return;
            }

            const hash = await this._attachmentsManager.getFileHash(urlToBlock);
            this._localStoreManager.setHash(hash);
            this.removeElm([selectedMessage]);
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
        await pageInterceptor.pageChange(async () => {
            const chatContainer = document.querySelector('[data-list-id="chat-messages"]');
            const toRemove: Element[] = [];
            for (let i = 0; i < chatContainer.children.length; i++) {
                const chatItem = chatContainer.children[i] as HTMLElement;
                if (await this.shouldRemove(chatItem)) {
                    toRemove.push(chatItem)
                }
            }
            this.removeElm(toRemove);
        });
        const elm = await waitForElm('[data-list-id="chat-messages"]');
        const chatEntries = elm.children;
        const toRemove: Element[] = [];
        for (let i = 0; i < chatEntries.length; i++) {
            const entry = chatEntries[i] as HTMLElement;
            if (await this.shouldRemove(entry)) {
                toRemove.push(entry);
            }
        }
        this.removeElm(toRemove);
    }
}

container.resolve(DiscordChatObserver);
