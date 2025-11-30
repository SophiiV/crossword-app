export type Direction = 'across' | 'down';

export interface Cell {
  row: number;
  col: number;
  isBlock: boolean;
  /** літера правильної відповіді (верхній регістр), тільки для не-блоків */
  solution?: string;
  /** номер, що виводиться у верхньому куті стартової клітинки слова */
  number?: number;
  /** внутрішній id слова (напр., A-1 або D-7) */
  entryId?: string;
}

export interface Entry {
  id: string;           // напр. "A-1" / "D-7"
  number: number;       // 1,2,3...
  direction: Direction; // across/down
  row: number;          // стартова клітинка
  col: number;
  length: number;
  clue: string;         // текст підказки
}

export interface Crossword {
  rows: number;
  cols: number;
  grid: Cell[][];       // завжди прямокутна
  entries: Entry[];     // усі слова з підказками
  title?: string;
  author?: string;
  updatedAt: string;
}
