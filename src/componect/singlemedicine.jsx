import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Heart, Share } from 'lucide-react';
import { getUserFromToken } from '../utils/auth';


const ProductPage = () => {
  const { id } = useParams();
  const productId = id;
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/medicines/one/${productId}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        setError("Failed to load product data. Please try again.");
      }
    };

    fetchProduct();
  }, [productId]);

  const handleImageHover = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = (e.clientX - left) / width * 100;
    const y = (e.clientY - top) / height * 100;
    setZoomPosition({ x, y });
  };
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };
  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };
  const handleRequest = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userData = getUserFromToken(token);
      if (!userData || !userData._id) {
        throw new Error('Invalid user data in token');
      }

      const requestingPharmacyId = userData._id;

      if (!product || !product.pharmacyId || !product.pharmacyId._id) {
        throw new Error('Product data is missing or does not include pharmacy ID');
      }

      const response = await fetch(`http://localhost:5000/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicine_id: product._id,
          requesting_pharmacy_id: requestingPharmacyId,
          fulfilling_pharmacy_id: product.pharmacyId._id,
          commission: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }

      alert('Request submitted successfully!');
    } catch (error) {
      console.error("Failed to submit request:", error);
      setError(error.message || 'An error occurred while submitting the request');
    } finally {
      setIsSubmitting(false);
    }
  };

  


  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <div className="border rounded-lg p-4 overflow-hidden relative">
          <div
              className="w-full pb-[100%] bg-cover bg-no-repeat cursor-zoom-in"
              style={{
                backgroundImage: `url("${product.images[currentImageIndex]}")`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
              onMouseMove={handleImageHover}
              onMouseLeave={() => setZoomPosition({ x: 0, y: 0 })}
            />
          </div>
          <div className="flex mt-4 gap-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className={`w-16 h-16 border rounded flex-shrink-0 cursor-pointer ${
                  index === currentImageIndex ? 'border-blue-500 border-2' : ''
                }`}
                onClick={() => handleThumbnailClick(index)}
              />
            ))}
          </div>
        </div>

        <div className="md:w-1/2">
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5" fill={i < 4 ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="ml-2 text-gray-600">({product.reviewsCount || 10} customer reviews)</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          <div className="mb-4">
            <span className="text-2xl font-bold text-blue-500">${product.price / 100}</span>
            <span className="ml-2 line-through text-gray-500">${(product.lastPrice || product.price) / 100}</span>
          </div>

          <p className="text-gray-600 mb-4">
            {product.description}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <div className="border rounded flex items-center">
              <button className="px-3 py-2" onClick={() => handleQuantityChange(-1)}>-</button>
              <input type="number" value={quantity} className="w-12 text-center" readOnly />
              <button className="px-3 py-2" onClick={() => handleQuantityChange(1)}>+</button>
            </div>
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
              onClick={handleRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request'}
            </button>
          </div>

          {error && <p className="text-red-500 mt-2">{error}</p>}

          <div className="flex items-center gap-4 text-gray-600">
            <button className="flex items-center"><Heart className="w-5 h-5 mr-1" /> Add to wishlist</button>
            <button className="flex items-center"><Share className="w-5 h-5 mr-1" /> Share</button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>SKU: {product._id}</p>
            <p>Category: {product.category.name}</p>
            <p>Tag: {product.category.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex border-b overflow-x-auto">
          {['description', 'additional', 'reviews'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 whitespace-nowrap ${activeTab === tab ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reviews' && ` (${product.reviewsCount || 0})`}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {activeTab === 'description' && <p>{product.description}</p>}
          {activeTab === 'additional' && <p>Additional information content goes here.</p>}
          {activeTab === 'reviews' && <p>Customer reviews content goes here.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;