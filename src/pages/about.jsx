import AboutUs from '../componect/about'
import Header from "../componect/head";
function About() {
    return ( 
        <>
        <Header/>
        <div className="px-10">
        <AboutUs/>
        </div>
        </>
     );
}

export default About;