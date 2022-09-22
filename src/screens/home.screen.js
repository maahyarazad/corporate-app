import React, { PureComponent, useContext, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableHighlight,
  View,
} from "react-native";
import { FeaturedBanner } from "../features/home/components/banner.component";
import { HomeCategory } from "../features/home/components/category.component";
import styled from "styled-components/native";
import { Spacer } from "../components/spacer/spacer.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UserContext } from "../services/user/user.context";
import { AuthContext } from "../services/auth/auth.context";
import { navigate } from "../navigation/navigate";
import { SectionContext } from "../services/section/section.context";
import { SearchButton } from "../components/searchbutton";
import { LocationContext } from "../services/location/location.context";
import { TopPartners } from "../features/home/components/toppartners.component";
import { typeEnum } from "../utils/constants";

const HomeContainer = styled(FlatList)`
  flex: 1;
`;

const NearMeButton = styled(TouchableHighlight)`
  background-color: white;
  padding: 10px 20px;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
`;

const wait = (timeout) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

export const HomeScreen = ({ ...props }) => {
  const { navigation } = props;
  const [refreshing, setRefreshing] = useState(false);
  const { getUserInfo, userInfo, setIsHomeInit } = useContext(UserContext);
  const { user } = useContext(AuthContext);
  const { setSectionTitle } = useContext(SectionContext);
  const [categoryList, setCategoryList] = useState([]);
  const { getLocations } = useContext(LocationContext);
  const [locationList, setLocationList] = useState();
  const [topPartners, setTopPartners] = useState();
  const [bannerList, setBannerList] = useState();

  useEffect(() => {
    let isMounted = true;

    if (userInfo == undefined) {
      if (isMounted) {
        getUserInfo(user.user_id);
      }
    }
    (async () => {
      try {
      } catch (error) {
        console.log(error);
        alert(error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const handleSearch = () => {
    setSectionTitle("Search All");

    navigate("LocationList", {
      type: typeEnum.category,
      search: 0,
      page: 1,
      limit: 20,
      source: 2,
      headerTitle: "Search All",
    });
  };

  class RenderHome extends PureComponent {
    render() {
      const handleNavigateMap = () => {
        navigation.navigate("Map");
      };

      return (
        <>
          <Spacer position={"top"} size={"medium"}>
            <Spacer position={"left"} size={"medium"}>
              <Spacer position={"right"} size={"medium"}>
                <View style={{ flexDirection: "row" }}>
                  {/* <TouchableOpacity style={{flex:}} onPress={() => {}}>
                      <Searchbar
                        // editable={false}
                        style={{ flex: 1 }}
                        onPressIn={handleSearch}
                        placeholder="Search"
                      />
                    </TouchableOpacity> */}
                  <SearchButton onPress={handleSearch} />
                  <Spacer position={"left"} size={"small"} />
                  <NearMeButton
                    underlayColor={"#EEE"}
                    onPress={handleNavigateMap}
                  >
                    <MaterialCommunityIcons
                      name="map-search"
                      size={25}
                      color={"#555"}
                    />
                  </NearMeButton>
                </View>
              </Spacer>
            </Spacer>
          </Spacer>
          <FeaturedBanner />
          <HomeCategory />
          <TopPartners />
        </>
      );
    }
  }

  const renderFooter = () => {
    return (
      <>
        <RenderHome />
      </>
    );
  };

  return (
    <HomeContainer
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      ListFooterComponent={renderFooter}
    ></HomeContainer>
  );
};
