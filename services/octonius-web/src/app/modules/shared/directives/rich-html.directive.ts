import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appRichHtml]',
  standalone: true
})
export class RichHtmlDirective implements OnChanges {
  @Input('appRichHtml') htmlContent: string | undefined = '';

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('htmlContent' in changes) {
      const content = this.htmlContent || '';
      this.el.nativeElement.innerHTML = content;
    }
  }
} 