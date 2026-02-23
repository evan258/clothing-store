import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";

const Home = ({user, categories}) => {
    return (
       <div> 
            <Header user={user} categories={categories} />
            <Banner />
        </div>
    );
}

export default Home;
