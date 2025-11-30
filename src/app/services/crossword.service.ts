import { Injectable } from '@angular/core';
import { Cell, Crossword, Direction, Entry } from '../models/crossword';

@Injectable({ providedIn: 'root' })
export class CrosswordService {

  createEmpty(rows = 13, cols = 13, title = 'New Crossword', author = 'You'): Crossword {
    const grid: Cell[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({ row: r, col: c, isBlock: false }))
    );
    const puzzle: Crossword = { rows, cols, grid, entries: [], title, author, updatedAt: new Date().toISOString() };
    this.reindex(puzzle);
    return puzzle;
  }

  /** Тогл “блок” (чорна клітинка), очищає літеру при блокуванні */
  toggleBlock(p: Crossword, r: number, c: number) {
    const cell = p.grid[r][c];
    cell.isBlock = !cell.isBlock;
    if (cell.isBlock) { delete cell.solution; delete cell.number; delete cell.entryId; }
    this.reindex(p);
    this.touch(p);
  }

  /** встановити літеру у клітинку (тільки A-Z), верхній регістр */
  setLetter(p: Crossword, r: number, c: number, ch: string | null) {
    const cell = p.grid[r][c];
    if (cell.isBlock) return;
    if (!ch) { delete cell.solution; }
    else {
      const up = ch.toUpperCase().match(/[A-ZА-ЯІЇЄҐ]/u) ? ch.toUpperCase() : null;
      if (up) cell.solution = up;
    }
    this.touch(p);
  }

  /** Перегенерація нумерації слів (Across/Down) + відновлення списку entries, зберігаючи введені підказки */
  reindex(p: Crossword) {
    const oldClues = new Map<string, string>(p.entries.map(e => [e.id, e.clue]));
    const entries: Entry[] = [];
    let number = 1;

    // скидаємо службові поля
    for (const row of p.grid) for (const cell of row) { delete cell.number; delete cell.entryId; }

    const isStartAcross = (r: number, c: number) =>
      !p.grid[r][c].isBlock &&
      (c === 0 || p.grid[r][c - 1].isBlock) &&
      (c + 1 < p.cols && !p.grid[r][c + 1].isBlock);

    const isStartDown = (r: number, c: number) =>
      !p.grid[r][c].isBlock &&
      (r === 0 || p.grid[r - 1][c].isBlock) &&
      (r + 1 < p.rows && !p.grid[r + 1][c].isBlock);

    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.grid[r][c].isBlock) continue;

        let started = false;

        if (isStartAcross(r, c)) {
          const len = this.lineLength(p, r, c, 'across');
          const id = `A-${number}`;
          entries.push({ id, number, direction: 'across', row: r, col: c, length: len, clue: oldClues.get(id) || '' });
          for (let k = 0; k < len; k++) p.grid[r][c + k].entryId = id;
          started = true;
        }
        if (isStartDown(r, c)) {
          const len = this.lineLength(p, r, c, 'down');
          const id = `D-${number}`;
          entries.push({ id, number, direction: 'down', row: r, col: c, length: len, clue: oldClues.get(id) || '' });
          for (let k = 0; k < len; k++) p.grid[r + k][c].entryId = id;
          started = true;
        }
        if (started) p.grid[r][c].number = number++;
      }
    }
    p.entries = entries;
    this.touch(p);
  }

  private lineLength(p: Crossword, r: number, c: number, dir: Direction) {
    let len = 0;
    if (dir === 'across') while (c + len < p.cols && !p.grid[r][c + len].isBlock) len++;
    else while (r + len < p.rows && !p.grid[r + len][c].isBlock) len++;
    return len;
  }

  setClue(p: Crossword, entryId: string, clue: string) {
    const e = p.entries.find(x => x.id === entryId);
    if (e) { e.clue = clue; this.touch(p); }
  }

  /** Перевірити користувацькі літери проти solution; повертає мапу помилок для підсвітки */
  checkAnswers(p: Crossword, user: string[][]) {
    const errors: boolean[][] = Array.from({ length: p.rows }, () => Array(p.cols).fill(false));
    for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
      const cell = p.grid[r][c];
      if (cell.isBlock) continue;
      const u = (user[r][c] || '').toUpperCase();
      if (u && cell.solution && u !== cell.solution) errors[r][c] = true;
    }
    return errors;
  }

  export(p: Crossword): string {
    return JSON.stringify(p, null, 2);
  }

  import(json: string): Crossword {
    const p = JSON.parse(json) as Crossword;
    // простий захист і відновлення типів
    p.updatedAt = new Date().toISOString();
    this.reindex(p);
    return p;
  }

  private touch(p: Crossword) { p.updatedAt = new Date().toISOString(); }
}
