import {singleton} from "tsyringe";

@singleton()
export class UiBuilder {

    private contentInjected = false;

    public injectContent(): void {
        if (this.contentInjected) {
            return;
        }
        const css = this.buildCss();
        const header = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' *">`;
        document.getElementsByTagName('head')[0].appendChild(css);
        this.contentInjected = true;
    }

    public buildHideImageButton(contextMenu: Element): HTMLDivElement | null {
        const hasEl = contextMenu.querySelector("#message_block_attachment") !== null;
        if (hasEl) {
            return null;
        }
        const div = document.createElement("div");
        div.innerHTML = `
            <div class="item-5ApiZt labelContainer-35-WEd colorDefault-2_rLdz" role="menuitem" id="message_block_attachment" tabindex="-1" data-menu-item="true">
               <div title="Hide all messages that contain this content" class="label-3CEiKJ" id="hide_content_msg">Hide content</div>
               <div class="label-3CEiKJ hidden" id="loading_blocked_image">Please wait...</div>
            </div>
        `
        return div;
    }

    public showLoading(active: boolean): void {
        const loadingMessage = document.getElementById("loading_blocked_image");
        const originalMessage = document.getElementById("hide_content_msg");
        const wrapper = document.getElementById("message_block_attachment");
        if (!loadingMessage || !originalMessage || !wrapper) {
            return;
        }
        if (active) {
            loadingMessage.classList.remove("hidden");
            originalMessage.classList.add("hidden");
            wrapper.classList.add("loading");
        } else {
            originalMessage.classList.remove("hidden");
            wrapper.classList.remove("loading");
            loadingMessage.classList.add("hidden");
        }
    }

    public isLoading(): boolean {
        const wrapper = document.getElementById("message_block_attachment");
        return wrapper.classList.contains("loading");
    }

    private buildCss(): HTMLStyleElement {
        const style = document.createElement("style");
        style.innerHTML = `
            #message_block_attachment:not(.loading):hover{
                background-color: var(--brand-experiment-600);
                color: var(--white-500);
            }
            .hidden{
                display: none;
            }
            #loading_blocked_image{
                cursor: not-allowed;
            }
        `;
        return style;
    }
}
