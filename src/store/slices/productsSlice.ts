import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../types/dropshipper';
import { productsService, type ProductsQueryParams } from '../../services/productsService';

interface ProductsState {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  categories: string[];
  activeCategory: string;
  searchQuery: string;
  stockFilter: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  selectedProductForModal: Product | null;
  selectedProductForCreate: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  total: 0,
  page: 1,
  totalPages: 1,
  categories: ['All', 'Electronics', 'Audio', 'Home & Living', 'Beauty & Wellness', 'Kitchenware'],
  activeCategory: 'All',
  searchQuery: '',
  stockFilter: 'all',
  sortBy: 'featured',
  viewMode: 'grid',
  selectedProductForModal: null,
  selectedProductForCreate: null,
  loading: false,
  error: null
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: ProductsQueryParams | undefined, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).products as ProductsState;
      const combinedParams: ProductsQueryParams = {
        category: state.activeCategory !== 'All' ? state.activeCategory : undefined,
        q: state.searchQuery || undefined,
        stockStatus: state.stockFilter !== 'all' ? state.stockFilter : undefined,
        sort: state.sortBy,
        page: params?.page || 1,
        limit: params?.limit || 50,
        ...params
      };
      const res = await productsService.getProducts(combinedParams);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch products');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await productsService.getCategories();
      return categories;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch categories');
    }
  }
);

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProductForModal: (state, action: PayloadAction<Product | null>) => {
      state.selectedProductForModal = action.payload;
    },
    setSelectedProductForCreate: (state, action: PayloadAction<Product | null>) => {
      state.selectedProductForCreate = action.payload;
    },
    setActiveCategory: (state, action: PayloadAction<string>) => {
      state.activeCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStockFilter: (state, action: PayloadAction<string>) => {
      state.stockFilter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  }
});

export const {
  setSelectedProductForModal,
  setSelectedProductForCreate,
  setActiveCategory,
  setSearchQuery,
  setStockFilter,
  setSortBy,
  setViewMode
} = productsSlice.actions;

export default productsSlice.reducer;

