/**
 * Represents a single data item in a list or table structure
 *
 * @interface DataItem
 */
export type DataItem = {
  /** Unique identifier for the data item */
  id: number;
  /** Primary text or name of the data item */
  title: string;
  /** Detailed text description of the data item */
  description: string;
  /** Additional optional field for extra information */
  optionalField?: string;
  /** Hex color code (e.g., '#FF0000') for visual representation */
  colorHex?: string;
  /** Additional details or metadata about the item */
  details?: string;
};

/**
 * Represents a group of related data items with a common type
 *
 * @interface ListGroup
 */
export type ListGroup = {
  /** The type or category of the group */
  type: string;
  /** Array of DataItem objects belonging to this group */
  items: DataItem[];
};
