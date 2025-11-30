import { Injectable } from '@angular/core';
import { Crossword } from '../models/crossword';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly KEY_EDITOR = 'cw_editor_current';
  private readonly KEY_PLAY   = 'cw_player_state';

  saveEditor(puzzle: Crossword) {
    localStorage.setItem(this.KEY_EDITOR, JSON.stringify(puzzle));
  }
  loadEditor(): Crossword | null {
    try { return JSON.parse(localStorage.getItem(this.KEY_EDITOR) || 'null'); } catch { return null; }
  }

  savePlayer(state: any) {
    localStorage.setItem(this.KEY_PLAY, JSON.stringify(state));
  }
  loadPlayer(): any | null {
    try { return JSON.parse(localStorage.getItem(this.KEY_PLAY) || 'null'); } catch { return null; }
  }
}
