import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Upload } from 'lucide-react';
import axios from 'axios';
import { getUserFromToken } from '../utils/auth';
import { useGlobalUser} from './useUser'; 

const api = {
  getMedicines: (userId) => axios.get(`https://pharmacies-management.onrender.com/api/medicines/pharmacies/${userId}/medicines`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  }),
  getCategories: () => axios.get(`https://pharmacies-management.onrender.com/api/categories`),
  addMedicine: (formData) => axios.post(`https://pharmacies-management.onrender.com/api/medicines`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    }
  }),
  updateMedicine: (id, medicine) => axios.put(`https://pharmacies-management.onrender.com/api/medicines/${id}`, medicine, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  }),
  deleteMedicine: (id) => axios.delete(`https://pharmacies-management.onrender.com/api/medicines/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  }),
  addCategory: (category) => axios.post(`https://pharmacies-management.onrender.com/api/categories`, category, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  }),
};

export default function MedicineManagement() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('medicines');
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');        

  const user = useGlobalUser(); 
  
  useEffect(() => {
    if (user && user._id) {
      fetchMedicines(user._id);
      fetchCategories();
    }
  }, [user]); 

  const fetchMedicines = async (userId) => {
    try {
      setLoading(true);
      const { data } = await api.getMedicines(userId);
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setError('Error fetching medicines');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredMedicines = medicines.filter(medicine => 
    (selectedCategory === 'all' || medicine.category === selectedCategory) &&
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-green-700">Medicine Management</h1>
      </header>
      
      <div className="mb-4">
        <button 
          className={`px-4 py-2 ${activeTab === 'medicines' ? 'bg-green-600 text-white' : 'bg-gray-200'} rounded mr-2`}
          onClick={() => setActiveTab('medicines')}
        >
          Medicines
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'categories' ? 'bg-green-600 text-white' : 'bg-gray-200'} rounded`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>
      
      {activeTab === 'medicines' ? (
        <MedicineTab 
          medicines={filteredMedicines}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onMedicineAdded={fetchMedicines}
          onMedicineUpdated={fetchMedicines}
          onMedicineDeleted={fetchMedicines}
        />
      ) : (
        <CategoryTab 
          categories={categories}
          onCategoryAdded={fetchCategories}
        />
      )}
    </div>
  );
}

function MedicineTab({
  medicines,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  onMedicineAdded,
  onMedicineUpdated,
  onMedicineDeleted,
}) {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <select 
            className="border p-2 rounded text-green-700"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
            <input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 border p-2 rounded"
            />
          </div>
        </div>
        <AddMedicineDialog categories={categories} onMedicineAdded={onMedicineAdded} />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Expiry Date</th>
              <th className="border p-2">Images</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map(medicine => (
              <tr key={medicine.id} className="hover:bg-gray-100">
                <td className="border p-2">{medicine.name}</td>
                <td className="border p-2">{medicine.category.name}</td>
                <td className="border p-2">{medicine.quantity}</td>
                <td className="border p-2">${medicine.price}</td>
                <td className="border p-2">{new Date(medicine.expiryDate).toLocaleDateString()}</td>
                <td className="border p-2">
                  {medicine.images && medicine.images.map((image, index) => (
                    <img key={index} src={image} alt={`${medicine.name} ${index + 1}`} className="w-10 h-10 object-cover inline-block mr-1" />
                  ))}
                </td>
                <td className="border p-2">
                  <EditMedicineDialog 
                    medicine={medicine}
                    categories={categories}
                    onMedicineUpdated={onMedicineUpdated}
                  />
                  <button
                    className="ml-2 p-1 bg-red-500 text-white rounded"
                    onClick={() => handleDelete(medicine.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  async function handleDelete(id) {
    try {
      await api.deleteMedicine(id);
      onMedicineDeleted();
    } catch (error) {
      console.error('Error deleting medicine:', error);
    }
  }
}

function AddMedicineDialog({ categories, onMedicineAdded }) {
  const user = useGlobalUser();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    pharmacyId: user ? user._id : '',
    name: '',
    category: '',
    quantity: '',
    price: '',
    expiryDate: '',
    description: '', 
    images: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.quantity || 
        !formData.expiryDate || !formData.category || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const data = new FormData();
   
    data.append('pharmacyId', user._id);
    data.append('category', formData.category);
    data.append('name', formData.name);
    data.append('quantity', formData.quantity);
    data.append('price', formData.price);
    data.append('expiryDate', formData.expiryDate);
    data.append('description', formData.description); // Added description

    // Append images
    if (formData.images.length > 0) {
      formData.images.forEach(image => {
        data.append('images', image);
      });
    }

    try {
      await api.addMedicine(data);
      onMedicineAdded();
      setIsOpen(false);
      setFormData({
        pharmacyId: user ? user._id : '',
        name: '',
        category: '',
        quantity: '',
        price: '',
        expiryDate: '',
        description: '',
        images: [],
      });
    } catch (error) {
      console.error('Error adding medicine:', error);
    }
  };

  return (
    <>
      <button
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4 inline-block mr-2" /> Add Medicine
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Medicine</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="Medicine Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <select 
                className="w-full border p-2 rounded"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full border p-2 rounded"
                placeholder="Medicine Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="3"
              />
              <input
                className="w-full border p-2 rounded"
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <input
                className="w-full border p-2 rounded"
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <input
                className="w-full border p-2 rounded"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
                  <Upload className="h-4 w-4 inline-block mr-2" />
                  Upload Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFormData({ ...formData, images: [...e.target.files] })}
                  />
                </label>
                <span>{formData.images.length} file(s) selected</span>
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
                Add Medicine
              </button>
            </form>
            <button
              className="mt-4 w-full bg-gray-300 hover:bg-gray-400 py-2 rounded"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function EditMedicineDialog({ medicine, categories, onMedicineUpdated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    ...medicine,
    category: medicine.category.id, // Ensure category ID is used
    expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateMedicine(medicine.id, formData);
      onMedicineUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating medicine:', error);
    }
  };

  return (
    <>
      <button
        className="p-1 bg-blue-500 text-white rounded"
        onClick={() => setIsOpen(true)}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Medicine</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="Medicine Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <select 
                className="w-full border p-2 rounded"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input
                className="w-full border p-2 rounded"
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              <input
               className="w-full border p-2 rounded"
               type="number"
               step="0.01"
               placeholder="Price"
               value={formData.price}
               onChange={(e) => setFormData({ ...formData, price: e.target.value })}
             />
             <input
               className="w-full border p-2 rounded"
               type="date"
               value={formData.expiryDate}
               onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
             />
             <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
               Update Medicine
             </button>
           </form>
           <button
             className="mt-4 w-full bg-gray-300 hover:bg-gray-400 py-2 rounded"
             onClick={() => setIsOpen(false)}
           >
             Cancel
           </button>
         </div>
       </div>
     )}
   </>
 );
}

function CategoryTab({ categories, onCategoryAdded }) {
 const [isOpen, setIsOpen] = useState(false);
 const [categoryName, setCategoryName] = useState('');

 const handleSubmit = async (e) => {
   e.preventDefault();
   try {
     await api.addCategory({ name: categoryName });
     onCategoryAdded();
     setIsOpen(false);
     setCategoryName('');
   } catch (error) {
     console.error('Error adding category:', error);
   }
 };

 return (
   <>
     <button
       className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
       onClick={() => setIsOpen(true)}
     >
       <Plus className="h-4 w-4 inline-block mr-2" /> Add Category
     </button>
     {isOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
         <div className="bg-white p-6 rounded-lg w-96">
           <h2 className="text-xl font-bold mb-4">Add New Category</h2>
           <form onSubmit={handleSubmit} className="space-y-4">
             <input
               className="w-full border p-2 rounded"
               placeholder="Category Name"
               value={categoryName}
               onChange={(e) => setCategoryName(e.target.value)}
             />
             <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
               Add Category
             </button>
           </form>
           <button
             className="mt-4 w-full bg-gray-300 hover:bg-gray-400 py-2 rounded"
             onClick={() => setIsOpen(false)}
           >
             Cancel
           </button>
         </div>
       </div>
     )}
   </>
 );
}