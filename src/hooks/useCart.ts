import { useAppContext } from '../context/AppContext';

export type { CartItem } from '../context/AppContext';

export function useCart() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal } = useAppContext();

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart, total: cartTotal };
}
