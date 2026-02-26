import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";

const Home = ({user, categories}) => {
    return (
       <div> 
            <Header user={user} categories={categories} />
            <Banner />
            <Brands />
        </div>
    );
}

export default Home;
