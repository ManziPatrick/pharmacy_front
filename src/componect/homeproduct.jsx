import React, { useEffect, useState } from 'react';
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

const ProductGrid = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          // navigate('/login');
          return;
        }
        
        const response = await fetch('https://pharmacies-management.onrender.com/api/medicines/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }
        
        const data = await response.json();
        setMedicines(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedicines();
  }, [navigate]);
  
  const handleCardClick = (id) => {
    navigate(`/medicines/${id}`);
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
  
  return (
    <div>
      <div className="product-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-4 px-8 gap-4">
        {medicines.length === 0 ? (
          <div className="text-center py-10">No medicines available</div>
        ) : (
          medicines.map((medicine) => (
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
              }}
              onClick={() => handleCardClick(medicine._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductGrid;