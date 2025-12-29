export interface Command {
  execute(): void;
  undo(): void;
  getDescription(): string;
  getTimestamp(): Date;
}