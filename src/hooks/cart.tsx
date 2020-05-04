import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsInAsyncStorage = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );
      if (productsInAsyncStorage) {
        const cart: Product[] = JSON.parse(productsInAsyncStorage);
        setProducts(cart);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(prod => prod.id === product.id);

      const newCart = productExists
        ? products.map(prod =>
            prod.id === product.id
              ? { ...prod, quantity: prod.quantity + 1 }
              : prod,
          )
        : [...products, { ...product, quantity: 1 }];

      setProducts(newCart);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newCart),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newCart = products.map(prod => {
        if (prod.id === id) {
          return { ...prod, quantity: prod.quantity + 1 };
        }
        return prod;
      });

      setProducts(newCart);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newCart),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newCart = products.map(prod => {
        if (prod.id === id && prod.quantity > 1) {
          return { ...prod, quantity: prod.quantity - 1 };
        }
        return prod;
      });

      setProducts(newCart);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newCart),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
