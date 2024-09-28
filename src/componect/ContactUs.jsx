import React from 'react';
import call from "../assets/icons8-call-80.png"
import map  from "../assets/icons8-map-90.png"
import time from "../assets/icons8-clock-96.png"
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className=' pb-6'>
        <h1 className="text-xl  font-serif text-center text-green-500 sm:text-xl sm:tracking-tight lg:text-xl">
          Contact Us
          </h1>
          <h1 className='text-4xl  font-serif text-center text-green-950 sm:text-4xl sm:tracking-tight lg:text-4xl'>
            Get In Touch</h1>
      </div>
      
      <div className=' grid grid-cols-3 px-12 gap-8'>
       <div className='flex flex-col space-x-1   border border-green-600 items-center text-center py-6  rounded-[20px]'>
        <img src={call} alt="" className=' size-16 font-extrabold' />
        <h2 className='text-2xl font-bold pb-4'>Contact Directly</h2>
        <span className=' font-thin text-green-950'>info@pharamacy.com</span>
        <span className='font-thin text-green-950'>+250788887888</span>
       </div>
       <div className='flex flex-col space-x-1  border border-green-600 items-center text-center py-6  rounded-[20px]'>
        <img src={time} alt="" className=' size-16 font-extrabold' />
        <h2 className='text-2xl font-bold pb-4'>Opening Hours</h2>
        <span className=' font-thin text-green-950'>Mon - Fri: 08:00am - 05:00pm</span>
        
       </div>
       <div className='flex flex-col space-x-1  border border-green-600 items-center text-center py-6  rounded-[20px]'>
        <img src={map} alt="" className=' size-16 font-extrabold' />
        <h2 className='text-2xl font-bold pb-4'>Company Address</h2>
        <span className=' font-thin text-green-950'>1910 Pacific Ave, Suite 2000</span>
        <span className=' font-thin text-green-950'>PMB 1017 Dallas, Tx 75201</span>
        
       </div>
       
      </div>
      <div className="max-w-7xl mx-auto">
        

        <div className="mt-16 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 bg-green-600 text-white">
              <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 mr-3 mt-1" />
                  <p>123 Health Street, Wellness City, MC 12345</p>
                </div>
                <div className="flex items-center">
                  <Phone className="h-6 w-6 mr-3" />
                  <p>+1 (555) 123-4567</p>
                </div>
                <div className="flex items-center">
                  <Mail className="h-6 w-6 mr-3" />
                  <p>contact@ourpharmacy.com</p>
                </div>
                <div className="flex items-start">
                  <Clock className="h-6 w-6 mr-3 mt-1" />
                  <p>
                    Monday - Friday: 8am - 9pm<br />
                    Saturday - Sunday: 10am - 6pm
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-semibold mb-6">Send Us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="mt-1 block w-full p-3 border-green-600 rounded-md shadow-sm focus:ring-green-500 outline-none focus:border-green-500 sm:text-sm"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="mt-1 block w-full outline-none p-3 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none p-3 sm:text-sm"
                    placeholder="Your message here..."
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;