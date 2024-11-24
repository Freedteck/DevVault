import Banner from "../../components/banner/Banner";
import Contributors from "../../components/contributors/Contributors";
import Features from "../../components/features/Features";
import Trending from "../../components/trending/Trending";

const Home = () => {
  return (
    <main>
      <Banner />
      <Features />
      <Trending />
      <Contributors/>
    </main>
  );
};

export default Home;
