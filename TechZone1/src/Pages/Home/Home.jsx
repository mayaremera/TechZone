import React from "react";
import classes from "../Home/Home.module.css";
import HeroSlider from "./../../Components/HeroSlider/HeroSlider";
import HomeCategorySlider from "./../../Components/HomeCategorySlider/HomeCategorySlider";
import HomeFeaturedProductsSection from "../../Components/HomeFeaturedProductsSection/HomeFeaturedProductsSection";
import HomeHotDeals from "./../../Components/HomeHotDeals/HomeHotDeals";
import HomeCustomersAlsoBought from "../../Components/HomeCustomersAlsoBought/HomeCustomersAlsoBought";
import HomePromotionSection from "../../Components/HomePromotionSection/HomePromotionSection";
import HomeGridProductsSection from "./../../Components/HomeGridProductsSection/HomeGridProductsSection";

export default function Home({ user }) {
  return (
    <>
      <HeroSlider />
      <HomeCategorySlider />
      <HomeFeaturedProductsSection />
      <HomePromotionSection />
      <HomeCustomersAlsoBought />
      <HomeHotDeals />
      <HomeCustomersAlsoBought />
      {/* <HomeGridProductsSection /> */}
    </>
  );
}
