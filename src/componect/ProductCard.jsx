import React from 'react';

const ProductCard = ({ product, onClick }) => {
  const {
    name,
    image,
    price,
    discountPrice,
    discount,
    isNew,
    rating,
  } = product;

  return (
    <div 
      className="product-card bg-white border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
      onClick={onClick} 
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
        
        {discount && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold py-1 px-2 rounded">
            -{discount}%
          </div>
        )}
        {isNew && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded">
            NEW
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">
          {name}
        </h3>

        <div className="flex items-center space-x-2 mb-2">
          {discountPrice ? (
            <>
              <span className="text-green-600 font-bold text-lg">
                ${discountPrice.toFixed(2)}
              </span>
              <span className="text-gray-500 line-through">
                ${price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-black font-bold text-lg">
              ${price.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, index) => (
            <svg
              key={index}
              className={`w-4 h-4 ${
                index < rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927a.7.7 0 011.902 0l2.09 4.234 4.676.68a.7.7 0 01.388 1.193l-3.388 3.296.8 4.66a.7.7 0 01-1.016.736L10 15.347l-4.19 2.2a.7.7 0 01-1.017-.735l.8-4.66L2.205 9.034a.7.7 0 01.388-1.193l4.676-.68 2.09-4.234z" />
            </svg>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded transition duration-200">
            request
          </button>
          <button className="text-gray-400 hover:text-red-500 transition duration-200">
            <i className="fas fa-heart"></i> ADD TO WISHLIST
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
