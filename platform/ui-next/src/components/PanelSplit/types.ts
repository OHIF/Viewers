export interface ItemProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Item {
  id: number;
  name: string;
  properties: ItemProperties;
}
