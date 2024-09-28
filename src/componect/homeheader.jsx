import React from "react";
import image from "../assets/pexels-shkrabaanthony-5214953.jpg"
import image2 from "../assets/68475de9c65177d28c8ab6b9226ca7ee.jpg"
import image3 from "../assets/68475de9c65177d28c8ab6b9226ca7ee.jpg"
const ArticleCard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white">

      <div className="md:col-span-2 relative">
        <img
          src={image3}
          alt="Doctor Image"
          className="w-full h-[80vh] object-cover rounded-lg"
        />
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-4 rounded-lg">
          <h2 className="text-2xl font-bold">How to manage stress and anxiety?</h2>
          <div className="flex items-center mt-2">
            <img
              src={image2}
              alt="Dr. Emma Wells"
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <p className="text-sm font-medium">Dr. Emma Wells</p>
              <p className="text-sm text-gray-600">Psychologist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Ads */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <img
            src={image}
            alt="Ad 1"
            className="w-full h-[40vh] object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded-lg">
            <p className="text-sm font-bold">Your New Daily Routine</p>
            <button className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs">
              BUY NOW
            </button>
          </div>
        </div>
        <div className="relative">
          <img
            src={image}
            alt="Ad 2"
            className="w-full h-[40vh] object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded-lg">
            <p className="text-sm font-bold">Vichy Laboratories</p>
            <p className="text-xs text-gray-600">Hyaluronic Acid Water Gel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
