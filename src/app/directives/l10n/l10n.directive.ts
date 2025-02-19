import {
    Directive,
    ElementRef,
    Renderer2,
    Input,
    ViewContainerRef,
    AfterViewInit,
    OnChanges
} from "@angular/core";

@Directive({
    selector: "[appLocalize]"
})
export class L10nDirective implements AfterViewInit, OnChanges {
    private lang = "es";
    @Input() appLocalizeIf: string;
    @Input() appLocalizeValue: string;

    private dict = {};

    constructor(private element: ElementRef, private renderer: Renderer2) {
        this.lang = navigator.language.toLowerCase() || "es";
        const [lang, _] = this.lang.split("-");
        this.lang = lang;
        if (!this.dict[this.lang]) {
            this.dict[this.lang] = {};
            const win: any = window;
            if (!win._l10n_reqs) {
                win._l10n_reqs = {};
                win._l10n_reqs[this.lang] = fetch(
                    `/assets/l10n/${this.lang}.json`
                ).then(res => {
                    if (res.status > 199 && res.status < 300) {
                        return res.json();
                    }
                });
            }
            win._l10n_reqs[this.lang].then(data => {
                this.dict[this.lang] = data;
                this.renderContent();
            });
        }
    }

    private renderContent(): void {
        if (this.appLocalizeValue) {
            const text = this.renderer.createText(
                this.getTranslation(this.appLocalizeValue)
            );
            this.element.nativeElement.childNodes.forEach(node => {
                this.renderer.removeChild(this.element.nativeElement, node);
            });
            this.renderer.appendChild(this.element.nativeElement, text);
        } else {
            const childElements = this.element.nativeElement.childNodes;
            childElements.forEach((child: any) => {
                if (this.appLocalizeIf) {
                    if (this.appLocalizeIf !== this.lang) {
                        this.element.nativeElement.style.display = "none";
                    }
                    if (child.nodeName === "#text") {
                        const text = this.renderer.createText(
                            this.getTranslation(child.textContent)
                        );
                        this.renderer.insertBefore(
                            this.element.nativeElement,
                            text,
                            this.renderer.nextSibling(child)
                        );
                        this.renderer.removeChild(
                            this.element.nativeElement,
                            child
                        );
                    }
                } else {
                    if (child.nodeName === "#text") {
                        this.renderer.removeChild(
                            this.element.nativeElement,
                            child
                        );
                        const text = this.renderer.createText(
                            this.getTranslation(child.textContent)
                        );
                        this.renderer.appendChild(
                            this.element.nativeElement,
                            text
                        );
                    }
                }
            });
        }
    }

    ngOnChanges(/* changes: SimpleChanges */): void {
        this.renderContent();
    }

    ngAfterViewInit(): void {
        this.renderContent();
    }

    private getTranslation(text: any): string {
        if (
            !text ||
            Object.prototype.toString.call(text).indexOf("String") === -1
        ) {
            text = "";
        }
        const short = text.trim();
        const res = this.dict[this.lang][short] || text.trim();
        const result = text.replace(text.trim(), res);
        return result;
    }
}
