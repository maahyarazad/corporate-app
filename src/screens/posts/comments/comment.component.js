import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React from "react";
import Avatar from "../avatar/avatar.component";
import { Label } from "../../../components/typography/label.component";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Spacer } from "../../../components/spacer/spacer.component";
import { theme } from "../../../infrastructure/theme";
import useLog from "../../../../hooks/useLog";

export default function Comment({ data, last, reply = false, onReply }) {
  const { logTime } = useLog();
  return (
    <View>
      <View
        style={[
          styles.header,
          { borderTopWidth: reply ? 0 : 1, borderColor: "#ddd" },
        ]}
      >
        {/* Profile Picture */}
        <View>
          <Avatar
            image={
              "https://fastly.picsum.photos/id/211/200/200.jpg?hmac=VJ4wl95YuQJMvM_1O83L3nSfTn20OxaVfWe0wNMZrIc"
            }
            size={30}
          />
        </View>
        {/* Details */}
        <View style={{ flex: 1 }}>
          <View style={styles.replyDetails}>
            <View
              style={{
                flexDirection: "row",
              }}
            >
              <Label
                size={"caption"}
                weight={"bold"}
              >{`${data.first_name} ${data.last_name}`}</Label>
              <Label size={"caption"} weight={"regular"}>
                {` • ${Math.abs(
                  Math.ceil(
                    moment
                      .duration(
                        new moment(data.date_commented).diff(
                          new moment(new Date())
                        )
                      )
                      .as("days")
                  )
                )} Days ago`}
              </Label>
            </View>

            {/* <Label
            size={"caption"}
            weight={"regular"}
          >{`${data.position}`}</Label> */}
          </View>
          <Label>{data.content}</Label>
          <View styles={styles.actionContainer}>
            <View style={styles.actions}>
              <View style={[styles.inline]}>
                <View style={[styles.inline, styles.chip]}>
                  {data && data.likeCount > 0 && (
                    <Label>{`${data.likeCount} `}</Label>
                  )}
                  <MaterialCommunityIcons
                    size={18}
                    name={data.like ? "thumb-up" : "thumb-up-outline"}
                    color={data.like ? theme.colors.icons.active : "black"}
                  />
                </View>
                <Spacer size={"small"} position={"right"} />
                <TouchableOpacity onPress={() => onReply(data)}>
                  <Label size={12} weight={"bold"}>
                    Reply
                  </Label>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Subcomments */}
      </View>

      {data && data.comments && (
        <View style={styles.subcomment}>
          {data.comments.map((sub) => {
            logTime(data);
            return (
              <Comment
                key={sub.id}
                data={sub}
                reply={true}
                onReply={() => onReply(data)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
  },
  replyDetails: {
    justifyContent: "center",
    paddingVertical: 6,
  },
  actionContainer: {},
  actions: {
    paddingTop: 6,
    alignSelf: "flex-start",
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
  },
  subcomment: {
    marginLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#ddd",
    marginBottom: 10,
  },
  chip: {
    backgroundColor: theme.colors.icons.active + "55",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 50,
    minWidth: 55,
    justifyContent: "center",
  },
});
