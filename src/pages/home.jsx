import AboutUs from "../componect/about";
import Categories from "../componect/categories";
import ContactUs from "../componect/ContactUs";
import Header from "../componect/head";
import ArticleCard from "../componect/homeheader";
import ProductGrid from "../componect/homeproduct";
import PharmacyMap from "../componect/map";
import ProductPage from "../componect/singlemedicine";

function Home() {
    return (<>
    <Header/>
    <div className="px-10">
       <ArticleCard/>
        <ProductGrid/> 
       {/* <Categories />
    /
    <AboutUs/>
    <ContactUs/>
    <ProductPage/> */}
    </div>
    
    
    <PharmacyMap />
    Home</>  );
}

export default Home;