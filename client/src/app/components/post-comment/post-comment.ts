import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../services/auth/auth';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

type CommentCreator = {
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
};

type Comment = {
  _id: string;
  comment: string;
  createdAt?: string;
  creator: CommentCreator | string;
};

@Component({
  selector: 'app-post-comment',
  standalone: true,
  imports: [CommonModule, MatIconModule, TimeAgoPipe],
  templateUrl: './post-comment.html',
  styleUrls: ['./post-comment.scss'],
})
export class PostComment {
  @Input({ required: true }) comment!: Comment;
  @Output() delete = new EventEmitter<string>();

  constructor(private auth: Auth) {}

  creator(): CommentCreator | null {
    const c = this.comment.creator;
    return typeof c === 'string' ? null : c;
  }

  isOwner(): boolean {
    const me = this.auth.getUserId();
    const c = this.creator();
    return !!me && !!c?.creatorId && me === c.creatorId;
  }

  onDelete(): void {
    this.delete.emit(this.comment._id);
  }
}
