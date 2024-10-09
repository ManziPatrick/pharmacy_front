import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';  // Use HashRouter instead of BrowserRouter
import SignUp from './pages/signup'; 
import Login from './pages/login';    
import Home from './pages/home';
import Requests from './pages/requests';
import Categories from './pages/category';
import About from './pages/about';
import Contactus from './pages/contactus';
import SingleM from './pages/singlemedicine';
import Chat from './pages/chat';
import Store from './pages/store';

function App() {
  const [userId, setUserId] = React.useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contactus />} />
        <Route path="/store" element={<Store />} />
        <Route path="/ask" element={<Chat userId={userId} />} />
        <Route path="/chat/:pharmacyId" element={<Chat userId={userId} />} />
        <Route path="/medicines/:id" element={<SingleM />} />
      </Routes>
    </Router>
  );
}

export default App;
