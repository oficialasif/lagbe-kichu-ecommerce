import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  product: {
    _id: string
    title: string
    price: number
    discountPrice?: number
    images: string[]
    seller: {
      _id: string
      name: string
    }
    stock: number
  }
  quantity: number
}

interface CartState {
  items: CartItem[]
  selectedItems: string[] // Array of product IDs that are selected
}

const initialState: CartState = {
  items: [],
  selectedItems: [],
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.product._id === action.payload.product._id
      )

      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      state.items = state.items.filter(
        (item) => item.product._id !== productId
      )
      // Also remove from selectedItems if present
      state.selectedItems = state.selectedItems.filter(
        (id) => id !== productId
      )
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item.product._id === action.payload.productId
      )
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(
            (item) => item.product._id !== action.payload.productId
          )
        } else {
          item.quantity = action.payload.quantity
        }
      }
    },
    clearCart: (state) => {
      state.items = []
      state.selectedItems = []
    },
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      const index = state.selectedItems.indexOf(productId)
      if (index > -1) {
        state.selectedItems.splice(index, 1)
      } else {
        state.selectedItems.push(productId)
      }
    },
    selectAllItems: (state) => {
      state.selectedItems = state.items.map((item) => item.product._id)
    },
    deselectAllItems: (state) => {
      state.selectedItems = []
    },
    removeSelectedItems: (state) => {
      state.items = state.items.filter(
        (item) => !state.selectedItems.includes(item.product._id)
      )
      state.selectedItems = []
    },
  },
})

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  toggleItemSelection,
  selectAllItems,
  deselectAllItems,
  removeSelectedItems,
} = cartSlice.actions

export default cartSlice.reducer

