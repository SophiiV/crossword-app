import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Crossword, Cell, Entry } from '../../models/crossword';
import { CrosswordService } from '../../services/crossword.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'cw-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  @Input() puzzle!: Crossword;

  constructor(public svc: CrosswordService, private store: StorageService) {}

  // ✅ списки для шаблону (без .filter у HTML)
  get acrossEntries(): Entry[] {
    return this.puzzle?.entries?.filter(e => e.direction === 'across') || [];
  }

  get downEntries(): Entry[] {
    return this.puzzle?.entries?.filter(e => e.direction === 'down') || [];
  }

  // 🔹 Створити нову сітку
  newGrid(rows: number, cols: number) {
    this.puzzle = this.svc.createEmpty(rows, cols, this.puzzle?.title || 'New Crossword', this.puzzle?.author || 'You');
    this.persist();
  }

  // 🔹 Редагування блоків та літер
  toggleBlock(c: Cell) {
    this.svc.toggleBlock(this.puzzle, c.row, c.col);
    this.persist();
  }

  typeLetter(c: Cell, ev: KeyboardEvent) {
    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      this.svc.setLetter(this.puzzle, c.row, c.col, null);
      this.persist();
      return;
    }
    if (ev.key === '#' || ev.key === '.') {
      this.toggleBlock(c);
      return;
    }
    if (ev.key.length === 1) {
      this.svc.setLetter(this.puzzle, c.row, c.col, ev.key);
      this.persist();
    }
  }

  setClue(id: string, value: string) {
    this.svc.setClue(this.puzzle, id, value);
    this.persist();
  }

  // ✅ Оновлення структури після зміни розмірів
  reindexGrid() {
    const { rows, cols } = this.puzzle;

    // Створюємо повністю нову сітку відповідно до нових розмірів
    const newGrid: Cell[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        row: r,
        col: c,
        isBlock: false
      }))
    );

    this.puzzle.grid = newGrid;

    // Виконуємо переіндексацію та збереження
    this.svc.reindex(this.puzzle);
    this.persist();
  }

  export() {
    const data = this.svc.export(this.puzzle);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.puzzle.title || 'crossword'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFile(files: FileList | null) {
    if (!files || !files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.puzzle = this.svc.import(String(reader.result));
        this.persist();
      } catch (e) {
        alert('Invalid crossword JSON');
      }
    };
    reader.readAsText(files[0]);
  }

  private persist() {
    this.store.saveEditor(this.puzzle);
  }
}
