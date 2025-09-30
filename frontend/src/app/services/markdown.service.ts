import { Injectable } from '@angular/core';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly marked = new Marked({
    gfm: true,
    breaks: true,
  });

  toHtml(markdown: string): string {
    const rendered = this.marked.parse(markdown ?? '') as string;
    return DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } });
  }
}
