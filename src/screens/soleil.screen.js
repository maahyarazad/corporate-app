import React, { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeArea } from "../components/safearea.component";

//API client
import axios from "axios";
import { Label } from "../components/typography/label.component";
import { Spacer } from "../components/spacer/spacer.component";
import { config } from "../utils/constants";

export const SoleilScreen = () => {
  const url = `${config.BASE_URL}members/gec/100`;
  const [memberList, setMemberList] = useState(null);

  const fetchDB = () => {
    axios
      .get(url)
      .then((response) => {
        setMemberList(response.data);
      })
      .catch((error) => {
        console.log(error.JSON());
      });
  };

  useEffect(() => {
    fetchDB();

    return () => {
      null;
    };
  }, []);

  const renderMembers = ({ item }) => {
    return (
      <>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View>
            <View>
              <Image
                style={{ width: 80, height: 80, borderRadius: 40 }}
                source={{
                  uri: `https://www.german-emirates-club.com/user/member_images/${item.image}_s1.jpg`,
                }}
              />
            </View>
          </View>
          
          <View style={{marginRight: 8}}/>

          <View>
            <Label size={"body"}>{item.username.toUpperCase()}</Label>
            <Label size={"caption"}>{item.email}</Label>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeArea>
      <TouchableOpacity
        style={{
          backgroundColor: "palegreen",
          flex: 1,
          margin: 10,
          maxHeight: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={fetchDB}
      >
        <Text>Refresh</Text>
      </TouchableOpacity>
      <View
        style={{
          flex: 1,
          padding: 10,
          alignItems: "flex-start",
        }}
      >
        <FlatList
          style={{ width: "100%" }}
          data={memberList}
          renderItem={renderMembers}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => {
            return <View style={{marginBottom: 6}}/>;
          }}
        ></FlatList>
      </View>
    </SafeArea>
  );
};
