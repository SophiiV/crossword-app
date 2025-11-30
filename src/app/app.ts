import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './components/editor/editor.component';
import { PlayerComponent } from './components/player/player.component';
import { Crossword } from './models/crossword';
import { CrosswordService } from './services/crossword.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, EditorComponent, PlayerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  tab: 'edit'|'play' = 'edit';
  puzzle: Crossword;

  constructor(cw: CrosswordService, store: StorageService) {
    this.puzzle = store.loadEditor() || cw.createEmpty(13,13,'Мій кросворд','Василюк Софія');
  }
}
export const App = AppComponent;
