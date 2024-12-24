import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';

const ProductSkeleton = () => (
  <div className="w-full h-[300px] rounded-lg overflow-hidden border shadow">
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const PaginationButton = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium transition-colors
      ${disabled 
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
        : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
  >
    {children}
  </button>
);

const ProductGrid = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `http://localhost:5000/api/medicines/all?page=${currentPage}&limit=${itemsPerPage}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }

        const data = await response.json();
        
        // Since backend returns an array, handle it directly
        setMedicines(data);
        // Calculate total pages based on array length
        const totalItems = data.length;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
        setHasMore(currentPage < Math.ceil(totalItems / itemsPerPage));
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [currentPage]);

  const handleCardClick = (id) => {
    navigate(`/medicines/${id}`);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  // Get current medicines for the page
  const getCurrentPageMedicines = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return medicines.slice(startIndex, endIndex);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${currentPage === i
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4 px-8">
        {[...Array(8)].map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">Error: {error}</div>;
  }

  const currentMedicines = getCurrentPageMedicines();

  return (
    <div>
      <div className="product-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-4 px-8 gap-4">
        {currentMedicines.length === 0 ? (
          <div className="text-center py-10 col-span-full">No medicines available</div>
        ) : (
          currentMedicines.map((medicine) => (
            <ProductCard
              key={medicine._id}
              product={{
                name: medicine.name,
                image: medicine.images && medicine.images.length > 0
                  ? medicine.images[0]
                  : 'https://i.pinimg.com/564x/26/cc/2e/26cc2e1691787120e18d6b91fe72b051.jpg',
                price: medicine.price,
                discountPrice: medicine.discountPrice,
                isNew: medicine.isNew,
                discount: medicine.discount,
                rating: medicine.rating || 4,
                category: medicine.category?.name,
                quantity: medicine.quantity,
                pharmacy: medicine.pharmacy?.pharmacyName
              }}
              onClick={() => handleCardClick(medicine._id)}
            />
          ))
        )}
      </div>

      {medicines.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 py-8">
          <PaginationButton 
            onClick={handlePreviousPage} 
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="ml-2">Previous</span>
          </PaginationButton>

          <div className="flex items-center gap-1">
            {renderPageNumbers()}
          </div>

          <PaginationButton 
            onClick={handleNextPage} 
            disabled={!hasMore}
          >
            <span className="mr-2">Next</span>
            <ChevronRight className="w-5 h-5" />
          </PaginationButton>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;