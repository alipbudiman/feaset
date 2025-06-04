import React, { createContext, useState, useContext } from 'react';

interface ListItem {
  id_product: string;
  name: string;
  stock: number;
  image: string;
  jumlah: number;
}

interface ListPinjamContextType {
  listPinjam: ListItem[];
  addToListPinjam: (item: ListItem) => void;
  updateJumlah: (id: string, newJumlah: number) => void;
  removeFromList: (id: string) => void;
  updateItemAmount: (id: string, amount: number) => void;
}

export const ListPinjamContext = createContext<ListPinjamContextType>({
  listPinjam: [],
  addToListPinjam: () => {},
  updateJumlah: () => {},
  removeFromList: () => {},
  updateItemAmount: () => {},
});

export const ListPinjamProvider = ({ children }: { children: React.ReactNode }) => {
  const [listPinjam, setListPinjam] = useState<ListItem[]>([]);

  const addToListPinjam = (item: ListItem) => {
    console.log('Adding item to list:', item);
    setListPinjam(prev => [...prev, item]);
  };

  const updateJumlah = (id: string, newJumlah: number) => {
    if (newJumlah <= 0) return;
    setListPinjam(prev =>
      prev.map(item =>
        item.id_product === id ? { ...item, jumlah: newJumlah } : item
      )
    );
  };

  const removeFromList = (id: string) => {
    setListPinjam(prev => prev.filter(item => item.id_product !== id));
  };

  const updateItemAmount = (id: string, amount: number) => {
    setListPinjam(prev => prev.map(item => 
      item.id_product === id ? { ...item, jumlah: amount } : item
    ));
  };

  return (
    <ListPinjamContext.Provider value={{ 
      listPinjam, 
      addToListPinjam,
      updateJumlah,
      removeFromList,
      updateItemAmount
    }}>
      {children}
    </ListPinjamContext.Provider>
  );
};

export const useListPinjam = () => useContext(ListPinjamContext);
