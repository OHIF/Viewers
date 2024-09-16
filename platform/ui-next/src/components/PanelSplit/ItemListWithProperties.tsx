import React from 'react';
import ItemList from './ItemList';
import PropertiesPanel from './PropertiesPanel';
import { Item } from './types';

interface ItemListWithPropertiesProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  selectedItem: Item | null;
}

const ItemListWithProperties: React.FC<ItemListWithPropertiesProps> = ({
  items,
  onSelectItem,
  selectedItem,
}) => {
  return (
    <div className="flex h-full flex-col">
      <ItemList
        items={items}
        onSelectItem={onSelectItem}
      />
      <PropertiesPanel selectedItem={selectedItem} />
    </div>
  );
};

export default ItemListWithProperties;
