import Banner from "../../components/banner/Banner";
import CallToAction from "../../components/calltoaction/CallToAction";
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
      <CallToAction/>
    </main>
  );
};

export default Home;
