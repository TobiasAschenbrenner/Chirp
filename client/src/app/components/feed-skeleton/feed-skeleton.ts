import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed-skeleton.html',
  styleUrls: ['./feed-skeleton.scss'],
})
export class FeedSkeleton implements OnChanges {
  @Input() count = 3;
  items: ReadonlyArray<number> = [];

  private buildItems(): ReadonlyArray<number> {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  ngOnChanges(): void {
    this.items = this.buildItems();
  }
}
