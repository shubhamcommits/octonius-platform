import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appRichHtml]',
  standalone: true
})
export class RichHtmlDirective implements OnChanges, OnInit, OnDestroy {
  @Input('appRichHtml') htmlContent: string | undefined = '';
  @Input('groupId') groupId?: string;
  @Input('workplaceId') workplaceId?: string;

  constructor(
    private el: ElementRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set up click listeners after initial content is set
    setTimeout(() => {
      this.setupFileMentionClickListeners();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // We set innerHTML directly to the string value.
    // Do NOT use DomSanitizer.bypassSecurityTrustHtml here, as it returns a SafeHtml object,
    // which is not compatible with innerHTML and can cause rendering issues.
    const content = this.htmlContent || '';
    this.el.nativeElement.innerHTML = content;
    
    // Set up click listeners after content changes
    setTimeout(() => {
      this.setupFileMentionClickListeners();
    }, 100);
  }

  ngOnDestroy(): void {
    // Clean up any event listeners if needed
  }

  private setupFileMentionClickListeners(): void {
    const fileMentions = this.el.nativeElement.querySelectorAll('.fileMention[data-type="file"]');
    console.log('🔍 RichHtmlDirective: Found file mentions to attach listeners to:', fileMentions.length);
    
    fileMentions.forEach((mention: HTMLElement, index: number) => {
      console.log(`🔍 RichHtmlDirective: Attaching listener to file mention ${index}:`, mention);
      
      // Remove existing listeners to avoid duplicates
      mention.removeEventListener('click', this.handleFileMentionClick);
      
      // Add click listener
      mention.addEventListener('click', this.handleFileMentionClick);
      
      // Add cursor pointer styling
      mention.style.cursor = 'pointer';
      
      console.log('🔍 RichHtmlDirective: Click listener attached successfully');
    });
  }

  private handleFileMentionClick = (event: Event): void => {
    console.log('🔍 RichHtmlDirective: File mention clicked!', event);
    event.preventDefault();
    event.stopPropagation();
    
    const mention = event.target as HTMLElement;
    const fileId = mention.getAttribute('data-id');
    const fileLabel = mention.getAttribute('data-label');
    
    console.log('🔍 RichHtmlDirective: File mention data:', { fileId, fileLabel });
    
    if (fileId) {
      this.navigateToFile(fileId, fileLabel || undefined);
    } else {
      console.warn('🔍 RichHtmlDirective: No file ID found in mention');
    }
  }

  private navigateToFile(fileId: string, fileLabel?: string): void {
    console.log('🔍 RichHtmlDirective: Navigating to file:', { fileId, fileLabel });
    
    // Determine the current context to decide which route to use
    const currentUrl = this.router.url;
    console.log('🔍 RichHtmlDirective: Current URL:', currentUrl);
    console.log('🔍 RichHtmlDirective: GroupId:', this.groupId);
    console.log('🔍 RichHtmlDirective: WorkplaceId:', this.workplaceId);
    
    if (currentUrl.startsWith('/workplace')) {
      // We're in workplace context, navigate to workplace files
      if (this.groupId) {
        const route = ['/workplace/files', this.groupId];
        console.log('🔍 RichHtmlDirective: Navigating to workplace files with group:', route);
        this.router.navigate(route, { 
          queryParams: { fileId: fileId }
        });
      } else {
        const route = ['/workplace/files'];
        console.log('🔍 RichHtmlDirective: Navigating to workplace files without group:', route);
        this.router.navigate(route, { 
          queryParams: { fileId: fileId }
        });
      }
    } else {
      // We're in myspace context, navigate to myspace files
      const route = ['/myspace/files'];
      console.log('🔍 RichHtmlDirective: Navigating to myspace files:', route);
      this.router.navigate(route, { 
        queryParams: { fileId: fileId }
      });
    }
  }
} 