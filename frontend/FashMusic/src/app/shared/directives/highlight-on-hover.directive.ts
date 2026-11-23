import { Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appHighlightOnHover]',
  standalone: true
})
export class HighlightOnHoverDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-4px)');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'var(--shadow-hover)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'var(--shadow-card)');
  }
}
