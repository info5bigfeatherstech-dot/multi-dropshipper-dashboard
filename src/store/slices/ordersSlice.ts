import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Order, OrderStatus } from '../../types/dropshipper';
import { ordersService } from '../../services/ordersService';

interface OrdersState {
  orders: Order[];
  totalOrdersCount: number;
  selectedOrderForDetail: Order | null;
  statusFilter: string;
  searchQuery: string;
  page: number;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  totalOrdersCount: 0,
  selectedOrderForDetail: null,
  statusFilter: 'all',
  searchQuery: '',
  page: 1,
  loading: false,
  error: null
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params: { page?: number; limit?: number; status?: string; search?: string } | undefined, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).orders as OrdersState;
      const res = await ordersService.getOrders({
        page: params?.page || state.page,
        status: params?.status || state.statusFilter,
        search: params?.search !== undefined ? params.search : state.searchQuery,
        limit: params?.limit || 50
      });
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch orders');
    }
  }
);

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSelectedOrderForDetail: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrderForDetail = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    addLocalOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      state.totalOrdersCount += 1;
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: OrderStatus; note?: string }>) => {
      const target = state.orders.find(o => o.id === action.payload.orderId || o.orderNumber === action.payload.orderId);
      if (target) {
        target.status = action.payload.status;
        target.timeline.push({
          status: action.payload.status,
          label: `Status marked as ${action.payload.status}`,
          timestamp: new Date().toISOString(),
          note: action.payload.note
        });
      }
      if (state.selectedOrderForDetail && (state.selectedOrderForDetail.id === action.payload.orderId || state.selectedOrderForDetail.orderNumber === action.payload.orderId)) {
        state.selectedOrderForDetail.status = action.payload.status;
        state.selectedOrderForDetail.timeline.push({
          status: action.payload.status,
          label: `Status marked as ${action.payload.status}`,
          timestamp: new Date().toISOString(),
          note: action.payload.note
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.totalOrdersCount = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setSelectedOrderForDetail,
  setStatusFilter,
  setSearchQuery,
  setPage,
  addLocalOrder,
  updateOrderStatus
} = ordersSlice.actions;

export default ordersSlice.reducer;

