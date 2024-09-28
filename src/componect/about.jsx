import React from 'react';
import { Users, Heart, Clock, Phone } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            About Our Pharmacy
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Dedicated to your health and well-being since 1995
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg shadow-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                      <Users className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Expert Staff</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Our team of experienced pharmacists and healthcare professionals are here to provide you with the best advice and care.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg shadow-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                      <Heart className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Patient-Centered Care</h3>
                  <p className="mt-5 text-base text-gray-500">
                    We prioritize your health and comfort, offering personalized services tailored to your unique needs.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg shadow-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                      <Clock className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">24/7 Availability</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Our doors are always open, ensuring you have access to essential medications and healthcare services round the clock.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Our Mission
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                At our pharmacy, we strive to improve the health and wellness of our community by providing high-quality pharmaceutical care, personalized service, and accessible health information. We are committed to being your trusted healthcare partner, ensuring that every interaction leaves you feeling cared for and informed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;