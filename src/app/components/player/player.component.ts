import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Crossword, Direction, Entry } from '../../models/crossword';
import { CrosswordService } from '../../services/crossword.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'cw-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  @Input() puzzle!: Crossword;

  dir: Direction = 'across';
  sel = { r: 0, c: 0 };
  userGrid: string[][] = [];
  errors: boolean[][] = [];
  completed = signal(false);

  // ✅ Окремі списки, щоб не фільтрувати у шаблоні
  acrossEntries: Entry[] = [];
  downEntries: Entry[] = [];

  constructor(private svc: CrosswordService, private store: StorageService) {}

  ngOnInit(): void {
    if (!this.puzzle) return;

    this.acrossEntries = this.puzzle.entries.filter(e => e.direction === 'across');
    this.downEntries = this.puzzle.entries.filter(e => e.direction === 'down');

    // створюємо порожню сітку для користувача
    this.userGrid = Array.from({ length: this.puzzle.rows }, () =>
      Array.from({ length: this.puzzle.cols }, () => '')
    );

    // відновлення збереженого стану
    const saved = this.store.loadPlayer();
    if (saved && saved.title === this.puzzle.title) {
      this.userGrid = saved.userGrid || this.userGrid;
      this.dir = saved.dir || 'across';
      this.sel = saved.sel || this.sel;
    }

    this.errors = this.svc.checkAnswers(this.puzzle, this.userGrid);
    this.updateCompletion();
  }

  saveState() {
    this.store.savePlayer({
      title: this.puzzle.title,
      userGrid: this.userGrid,
      dir: this.dir,
      sel: this.sel
    });
  }

  clickCell(r: number, c: number) {
    if (this.puzzle.grid[r][c].isBlock) return;
    this.sel = { r, c };
  }

  key(e: KeyboardEvent) {
    const { r, c } = this.sel;

    if (e.key === 'ArrowLeft') return this.move(-1, 0);
    if (e.key === 'ArrowRight') return this.move(1, 0);
    if (e.key === 'ArrowUp') return this.move(0, -1);
    if (e.key === 'ArrowDown') return this.move(0, 1);

    if (e.key === 'Tab') {
      e.preventDefault();
      return this.jumpNextEntry(1);
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.put('', r, c);
      this.step(-1);
      return;
    }

    if (e.key.length === 1) {
      const ch = e.key.toUpperCase().match(/[A-ZА-ЯІЇЄҐ]/u) ? e.key.toUpperCase() : null;
      if (ch) {
        this.put(ch, r, c);
        this.step(1);
      }
    }
  }

  toggleDir() {
    this.dir = this.dir === 'across' ? 'down' : 'across';
    this.saveState();
  }

  put(ch: string, r: number, c: number) {
    if (this.puzzle.grid[r][c].isBlock) return;
    this.userGrid[r][c] = ch;
    this.errors = this.svc.checkAnswers(this.puzzle, this.userGrid);
    this.updateCompletion();
    this.saveState();
  }

  step(delta: number) {
    let { r, c } = this.sel;
    const inc = this.dir === 'across' ? [0, Math.sign(delta)] : [Math.sign(delta), 0];
    const limit = this.dir === 'across' ? this.puzzle.cols : this.puzzle.rows;

    for (let i = 0; i < limit; i++) {
      r += inc[0];
      c += inc[1];
      if (r < 0 || c < 0 || r >= this.puzzle.rows || c >= this.puzzle.cols) break;
      if (!this.puzzle.grid[r][c].isBlock) {
        this.sel = { r, c };
        break;
      }
    }
  }

  move(dx: number, dy: number) {
    const r = this.sel.r + dy;
    const c = this.sel.c + dx;
    if (r < 0 || c < 0 || r >= this.puzzle.rows || c >= this.puzzle.cols) return;
    if (!this.puzzle.grid[r][c].isBlock) this.sel = { r, c };
  }

  jumpNextEntry(dir: 1 | -1) {
    const ids = Array.from(new Set(this.puzzle.grid.flat().map(c => c.entryId).filter(Boolean))) as string[];
    const here = this.puzzle.grid[this.sel.r][this.sel.c].entryId;
    const idx = ids.indexOf(here || '');
    const next = ids[(idx + dir + ids.length) % ids.length];
    if (!next) return;
    const e = this.puzzle.entries.find(x => x.id === next)!;
    this.dir = e.direction;
    this.sel = { r: e.row, c: e.col };
    this.saveState();
  }

  check() {
    this.errors = this.svc.checkAnswers(this.puzzle, this.userGrid);
  }

  revealCell() {
    const { r, c } = this.sel;
    const sol = this.puzzle.grid[r][c].solution;
    if (sol) this.put(sol, r, c);
  }

  revealWord() {
    const { r, c } = this.sel;
    const id = this.puzzle.grid[r][c].entryId;
    if (!id) return;
    const e = this.puzzle.entries.find(x => x.id === id)!;
    for (let k = 0; k < e.length; k++) {
      const rr = e.direction === 'down' ? e.row + k : e.row;
      const cc = e.direction === 'across' ? e.col + k : e.col;
      const sol = this.puzzle.grid[rr][cc].solution;
      if (sol) this.put(sol, rr, cc);
    }
  }

  reset() {
    this.userGrid = this.userGrid.map(row => row.map(() => ''));
    this.errors = this.svc.checkAnswers(this.puzzle, this.userGrid);
    this.completed.set(false);
    this.saveState();
  }

  private updateCompletion() {
    let ok = true;
    for (let r = 0; r < this.puzzle.rows; r++) {
      for (let c = 0; c < this.puzzle.cols; c++) {
        const cell = this.puzzle.grid[r][c];
        if (cell.isBlock) continue;
        if (!cell.solution || this.userGrid[r][c].toUpperCase() !== cell.solution) {
          ok = false;
          break;
        }
      }
    }
    this.completed.set(ok);
  }
}
