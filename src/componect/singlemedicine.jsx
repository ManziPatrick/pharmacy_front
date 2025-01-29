import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Heart, Share } from 'lucide-react';
import { getUserFromToken } from '../utils/auth';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://pharmacies-management.onrender.com/api/medicines/one/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        setError("Failed to load product data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageHover = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = (e.clientX - left) / width * 100;
    const y = (e.clientY - top) / height * 100;
    setZoomPosition({ x, y });
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleRequest = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const userData = getUserFromToken(token);
      if (!userData?._id) throw new Error('Invalid user data');

      const response = await fetch(`https://pharmacies-management.onrender.com/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicine_id: product._id,
          requesting_pharmacy_id: userData._id,
          fulfilling_pharmacy_id: product.pharmacyId._id,
          commission: quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit request');
      
      alert('Request submitted successfully!');
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Section */}
        <div className="md:w-1/2">
          <div className="border rounded-lg p-4 overflow-hidden">
            {isLoading ? (
              <div className="w-full pb-[100%] bg-gray-200 animate-pulse" />
            ) : (
              <div
                className="w-full pb-[100%] bg-cover bg-no-repeat cursor-zoom-in"
                style={{
                  backgroundImage: `url("${product?.images[currentImageIndex]}")`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
                onMouseMove={handleImageHover}
                onMouseLeave={() => setZoomPosition({ x: 0, y: 0 })}
              />
            )}
          </div>
          <div className="flex mt-4 gap-2 overflow-x-auto">
            {isLoading ? (
              [...Array(4)].map((_, index) => (
                <div key={index} className="w-16 h-16 bg-gray-200 animate-pulse rounded flex-shrink-0" />
              ))
            ) : (
              product?.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-16 h-16 border rounded flex-shrink-0 cursor-pointer ${
                    index === currentImageIndex ? 'border-blue-500 border-2' : ''
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))
            )}
          </div>
        </div>

        {/* Product Details Section */}
        <div className="md:w-1/2">
          {isLoading ? (
            <>
              <div className="flex items-center mb-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
                <div className="ml-2 w-24 h-5 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-8 bg-gray-200 animate-pulse rounded mb-2 w-3/4" />
              <div className="h-6 bg-gray-200 animate-pulse rounded mb-4 w-1/4" />
              <div className="space-y-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 animate-pulse rounded w-full" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" fill={i < 4 ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">({product?.reviewsCount || 10} reviews)</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{product?.name}</h1>
              <div className="mb-4">
                <span className="text-2xl font-bold text-blue-500">${product?.price / 100}</span>
                <span className="ml-2 line-through text-gray-500">${(product?.lastPrice || product?.price) / 100}</span>
              </div>
              <p className="text-gray-600 mb-4">{product?.description}</p>
            </>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div className="border rounded flex items-center">
              <button className="px-3 py-2" onClick={() => handleQuantityChange(-1)}>-</button>
              <input type="number" value={quantity} className="w-12 text-center" readOnly />
              <button className="px-3 py-2" onClick={() => handleQuantityChange(1)}>+</button>
            </div>
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
              onClick={handleRequest}
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request'}
            </button>
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <button className="flex items-center" disabled={isLoading}>
              <Heart className="w-5 h-5 mr-1" /> Add to wishlist
            </button>
            <button className="flex items-center" disabled={isLoading}>
              <Share className="w-5 h-5 mr-1" /> Share
            </button>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-600">
              <p>SKU: {product?._id}</p>
              <p>Category: {product?.category?.name}</p>
              <p>Tag: {product?.category?.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-8">
        <div className="flex border-b overflow-x-auto">
          {['description', 'additional', 'reviews'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 whitespace-nowrap ${
                activeTab === tab ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab(tab)}
              disabled={isLoading}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reviews' && ` (${product?.reviewsCount || 0})`}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded w-full" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'description' && <p>{product?.description}</p>}
              {activeTab === 'additional' && <p>Additional information content goes here.</p>}
              {activeTab === 'reviews' && <p>Customer reviews content goes here.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;