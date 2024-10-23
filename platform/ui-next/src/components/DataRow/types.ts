export interface DataItem {
  id: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
}

export interface ListGroup {
  type: string;
  items: DataItem[];
}
