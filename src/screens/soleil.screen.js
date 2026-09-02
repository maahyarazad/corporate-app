import React, { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { SafeArea } from "../components/safearea.component";

//API client
import axios from "axios";
import { Label } from "../components/typography/label.component";
import { config } from "../utils/constants";
import { REMOVE_CLIPPED_SUBVIEWS } from "../utils/listPerf";

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
        <View style={styles.rowCenter}>
          <View>
            <View>
              <Image
                style={styles.image}
                source={{
                  uri: `https://www.german-emirates-club.com/user/member_images/${item.image}_s1.jpg`,
                }}
              />
            </View>
          </View>
          
          <View style={styles.spacer}/>

          <View>
            <Label size="body">{item.username.toUpperCase()}</Label>
            <Label size="caption">{item.email}</Label>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeArea>
      <TouchableOpacity style={styles.centerBox} onPress={fetchDB}>
        <Text>Refresh</Text>
      </TouchableOpacity>
      <View style={styles.flexBox}>
        <FlatList
          removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
          style={styles.flatList}
          data={memberList}
          renderItem={renderMembers}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => {
            return <View style={styles.spacer2}/>;
          }}
        ></FlatList>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  spacer: {
    marginRight: 8,
  },
  centerBox: {
    backgroundColor: "palegreen",
    flex: 1,
    margin: 10,
    maxHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  flexBox: {
    flex: 1,
    padding: 10,
    alignItems: "flex-start",
  },
  flatList: {
    width: "100%",
  },
  spacer2: {
    marginBottom: 6,
  },
});
