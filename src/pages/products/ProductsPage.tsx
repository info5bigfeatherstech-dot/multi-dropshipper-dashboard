import React, { useEffect } from 'react';
import {
  Search,
  Grid,
  List,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Package,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProducts,
  fetchCategories,
  setActiveCategory,
  setSearchQuery,
  setStockFilter,
  setSortBy,
  setViewMode
} from '../../store/slices/productsSlice';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductListItem } from '../../components/products/ProductListItem';
import { ProductDetailModal } from '../../components/products/ProductDetailModal';
import { Button } from '../../components/ui/Button';

export const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    categories,
    activeCategory,
    searchQuery,
    stockFilter,
    sortBy,
    viewMode,
    loading
  } = useAppSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleCategoryClick = (cat: string) => {
    dispatch(setActiveCategory(cat));
    dispatch(fetchProducts());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchProducts());
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setStockFilter(e.target.value));
    dispatch(fetchProducts());
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSortBy(e.target.value));
    dispatch(fetchProducts());
  };

  return (
    <div className="space-y-6">
      {/* Detail Slide-over Modal */}
      <ProductDetailModal />

      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Wholesale Sourcing
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">
            Verified Indian supplier inventory with automated domestic express dropship dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(fetchProducts())}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Stock
          </Button>
        </div>
      </div>

      {/* Search & Filter Controls Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Instant Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or specs..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-400"
            />
          </form>

          {/* Controls: Stock filter, Sort, and Grid/List View switcher */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Stock Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={stockFilter}
                onChange={handleStockChange}
                className="rounded-xl border border-slate-200/90 bg-white py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none"
              >
                <option value="all">All Inventory</option>
                <option value="in_stock">In Stock (&gt;5)</option>
                <option value="low_stock">Low Stock (1-5)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="rounded-xl border border-slate-200/90 bg-white py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none"
              >
                <option value="featured">Featured Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => dispatch(setViewMode('grid'))}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => dispatch(setViewMode('list'))}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs shadow-brand-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid / List */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs animate-pulse space-y-3">
              <div className="aspect-[4/3] w-full bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded mt-3" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, clearing stock filters, or exploring a different category.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch(setActiveCategory('All'));
              dispatch(setSearchQuery(''));
              dispatch(setStockFilter('all'));
              dispatch(fetchProducts());
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

