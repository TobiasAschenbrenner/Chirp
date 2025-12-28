import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../components/sidebar/sidebar';

type MockPost = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Sidebar],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  posts: MockPost[] = [
    {
      id: '1',
      author: 'Alice Schneider',
      body: 'Hello this is my first post!',
      createdAt: new Date().toLocaleString(),
    },
  ];

  openThemes(): void {
    console.log('Open themes modal (todo)');
  }
}
