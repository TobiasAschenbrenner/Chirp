import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FeedMode } from '../../models/feed-mode.model';

@Component({
  selector: 'app-for-you-or-following',
  standalone: true,
  imports: [],
  templateUrl: './for-you-or-following.html',
  styleUrls: ['./for-you-or-following.scss'],
})
export class ForYouOrFollowing {
  @Input() active: FeedMode = 'foryou';
  @Output() modeChange = new EventEmitter<FeedMode>();

  readonly modes: ReadonlyArray<{ key: FeedMode; label: string }> = [
    { key: 'foryou', label: 'For you' },
    { key: 'following', label: 'Following' },
  ];

  setMode(mode: FeedMode): void {
    if (mode === this.active) return;
    this.modeChange.emit(mode);
  }
}
