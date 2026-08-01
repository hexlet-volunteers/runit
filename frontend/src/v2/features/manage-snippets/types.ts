import { type Snippet } from '../../entities/snippet';

export type BulkBarProps = {
  count: number;
  onClear: () => void;
};

export type EmptyStateProps = {
  onCreateClick: () => void;
  onCreateExample: (language: string) => void;
  creating: boolean;
};

export type SnippetCardProps = {
  snippet: Snippet;
  username: string;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
};