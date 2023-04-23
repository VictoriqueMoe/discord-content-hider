import {singleton} from "tsyringe";
import {UiBuilder} from "../UiBuilder";
import md5 = require("md5");

const GM_fetch = require("@trim21/gm-fetch");
export type Attachment = string

export enum AttachmentType {
    IMAGE,
    VIDEO,
    BINARY
}

@singleton()
export class AttachmentsManager {

    public constructor(private _uiBuilder: UiBuilder) {
    }

    public gatAttachmentsUrls(attachmentWrapper: Element): Attachment[] {
        const attachments = attachmentWrapper.querySelectorAll(`[class^="messageAttachment"]`);
        const embeds = attachmentWrapper.querySelectorAll(`[class^="inlineMediaEmbed"]`);
        if ((!attachments || attachments.length === 0) && (!embeds && embeds.length === 0)) {
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
        for (let i = 0; i < embeds.length; i++) {
            const embed = embeds[i];
            const videos = embed.querySelectorAll("video");
            if (videos && videos.length > 0) {
                videos.forEach(video => retArr.push(video.src));
            } else {
                const anchors = embed.querySelectorAll("a");
                anchors.forEach(el => retArr.push(el.href));
            }
        }
        return retArr.map(url => url.replace("media.discordapp.net", "cdn.discordapp.com"));
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

    public async getAttachmentFileSize(url: string): Promise<number> {
        this._uiBuilder.showLoading(true);
        try {
            const headCheck = await GM_fetch(url, {
                method: "HEAD"
            });
            const contentLengthStr = headCheck.headers.get("content-length");
            if (!contentLengthStr) {
                return -1;
            }
            return Number.parseInt(contentLengthStr);
        } finally {
            this._uiBuilder.showLoading(false);
        }
    }

    public async getFileHash(url: string): Promise<string> {
        const res = await GM_fetch(url, {method: "POST"});
        const buffer = await res.arrayBuffer();
        const transformedBuffer = new Uint8Array(buffer);
        return md5(transformedBuffer);
    }
}
