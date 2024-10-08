import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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
          throw new Error("Not authorized, no token");
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
  }, []);

  const handleCardClick = (id) => {
  
    navigate(`/medicines/${id}`);
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
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
