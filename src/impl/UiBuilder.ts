import {singleton} from "tsyringe";

@singleton()
export class UiBuilder {

    private contentInjected = false;

    public injectContent(): void {
        if (this.contentInjected) {
            return;
        }
        const css = this.buildCss();
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
               <div title="Hide all messages that contain this content" class="label-3CEiKJ">Hide content</div>
            </div>
        `
        return div;
    }

    private buildCss(): HTMLStyleElement {
        const style = document.createElement("style");
        style.innerHTML = `
            #message_block_attachment:hover{
                background-color: var(--brand-experiment-600);
                color: var(--white-500);
            }
        `;
        return style;
    }
}
