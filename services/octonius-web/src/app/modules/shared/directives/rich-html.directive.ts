import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appRichHtml]',
  standalone: true
})
export class RichHtmlDirective implements OnChanges {
  @Input('appRichHtml') htmlContent: string | undefined = '';

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // We set innerHTML directly to the string value.
    // Do NOT use DomSanitizer.bypassSecurityTrustHtml here, as it returns a SafeHtml object,
    // which is not compatible with innerHTML and can cause rendering issues.
    const content = this.htmlContent || '';
    this.el.nativeElement.innerHTML = content;
  }
} 