import {singleton} from "tsyringe";


export type Attachment = string

export enum AttachmentType {
    IMAGE,
    VIDEO,
    BINARY
}

@singleton()
export class AttachmentsManager {

    public gatAttachments(attachmentWrapper: Element): Attachment[] {
        const attachments = attachmentWrapper.querySelectorAll(`[class^="messageAttachment"]`);
        if (!attachments || attachments.length === 0) {
            return [];
        }
        const retArr: Attachment[] = [];
        for (let i = 0; i < attachments.length; i++) {
            const messageAttach = attachments[i];
            const attachmentType = this.detectAttachmentType(messageAttach);
            if (attachmentType === null) {
                continue;
            }
            switch (attachmentType) {
                case AttachmentType.IMAGE:
                    const images = messageAttach.querySelectorAll("img");
                    images.forEach(img => retArr.push(img.src));
                    break;
                case AttachmentType.VIDEO:
                case AttachmentType.BINARY:
                    const urlsElements = messageAttach.querySelectorAll("a");
                    urlsElements.forEach(el => retArr.push(el.href));
                    break;
            }
        }
        return retArr;
    }

    private detectAttachmentType(messageAttach: Element): AttachmentType | null {
        const isImage = messageAttach.querySelector("img") !== null;
        if (isImage) {
            return AttachmentType.IMAGE;
        }
        const isVideo = messageAttach.querySelectorAll("video") !== null;
        if (isVideo) {
            return AttachmentType.VIDEO;
        }
        const isBinary = messageAttach.querySelectorAll("a") !== null;
        if (isBinary) {
            return AttachmentType.BINARY;
        }
        return null
    }
}
