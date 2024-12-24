import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Eye, ChevronRight } from 'lucide-react';
import image from "../assets/pexels-pixabay-159211.jpg"
import { useNavigate } from 'react-router-dom';

const SkeletonCategory = () => (
  <div className="px-4 py-2 animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
  </div>
);

const SkeletonMedicineCard = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
    <div className="h-36 bg-gray-300"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
      <div className="h-5 bg-gray-300 rounded w-1/4 mb-2"></div>
    </div>
  </div>
);

const MedicineListing = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch(`http://localhost:5000/api/categories`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMedicines = async () => {
      if (selectedCategory) {
        setLoadingMedicines(true);
        try {
          const response = await fetch(`http://localhost:5000/api/medicines/category/${selectedCategory._id}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setMedicines(data.medicines);
        } catch (error) {
          console.error('Error fetching medicines:', error);
        } finally {
          setLoadingMedicines(false);
        }
      }
    };

    fetchMedicines();
  }, [selectedCategory]);

  const navigate = useNavigate(); 
  const handleCardClick = (id) => {
    navigate(`/medicines/${id}`);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2 text-gray-800">Categories</h2>
        </div>
        <nav className="overflow-y-auto max-h-[calc(100vh-5rem)]">
          {loadingCategories ? (
            Array.from({ length: 5 }).map((_, index) => <SkeletonCategory key={index} />)
          ) : (
            categories.map((category) => (
              <div
                key={category._id}
                className={`flex items-center px-4 py-2 cursor-pointer transition-colors duration-200 
                  ${selectedCategory?._id === category._id 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-blue-50'}`}
                onClick={() => handleCategoryClick(category)}
              >
                <ChevronRight size={16} className={`mr-2 transition-transform duration-200 ${selectedCategory?._id === category._id ? 'transform rotate-90' : ''}`} />
                <span className="truncate">{category.name}</span>
              </div>
            ))
          )}
        </nav>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedCategory && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedCategory.name}</h2>
            <p className="text-sm text-gray-600">{selectedCategory.description}</p>
          </div>
        )}
        {loadingMedicines ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonMedicineCard key={index} />
            ))}
          </div>
        ) : medicines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {medicines.map((medicine) => (
              <div key={medicine._id} className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                <img src={medicine?.images[0] || image} alt={medicine.name} className="w-full h-36 object-cover" />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{medicine.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">Qty: {medicine.quantity} | Exp: {new Date(medicine.expiryDate).toLocaleDateString()}</p>
                  <p className="text-lg font-bold text-green-500 mb-3">${medicine.price.toFixed(2)}</p>
                  <div className="flex justify-between items-center">
                    <button 
                      className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center transition-colors duration-200 hover:bg-blue-600" 
                      onClick={() => handleCardClick(medicine._id)} 
                    >
                      <ShoppingCart className="mr-1" size={14} />
                      Request
                    </button>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
                        <Eye size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-lg text-gray-600 mt-8">
            {selectedCategory ? "No medicines available for this category." : "Please select a category to view medicines."}
          </p>
        )}
      </div>
    </div>
  );
};

export default MedicineListing;
