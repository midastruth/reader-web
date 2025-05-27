export interface TocItem {
  id: string;
  href: string;
  title?: string;
  children?: TocItem[];
  position?: number;
}