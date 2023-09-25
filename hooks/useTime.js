import { View, Text } from "react-native";
import React from "react";
import moment from "moment";

const useTime = () => {
  const timeDiffString = (date) => {
    const minute = 60000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    const diff = Math.abs(
      Math.ceil(
        moment
          .duration(new moment(date).diff(new moment(new Date())))
          .as("milliseconds")
      )
    );

    if (diff > 0 && diff < minute) {
      return "Just Now";
    } else if (diff > minute && diff < hour) {
      const result = calculateUnit(diff, minute);
      return `${result} min${result > 1 ? "s" : ""} ago`;
    } else if (diff > hour && diff < day) {
      const result = calculateUnit(diff, hour);
      return `${result} hr${result > 1 ? "s" : ""} ago`;
    } else if (diff > day && diff < week) {
      const result = calculateUnit(diff, day);
      return `${result} day${result > 1 ? "s" : ""} ago`;
    } else if (diff > week && diff < month) {
      const result = calculateUnit(diff, week);
      return `${result} week${result > 1 ? "s" : ""} ago`;
    } else if (diff > month && diff < year) {
      const result = calculateUnit(diff, month);
      return `${result} month${result > 1 ? "s" : ""} ago`;
    } else if (diff > year) {
      const result = calculateUnit(diff, year);
      return `${result} year${result > 1 ? "s" : ""} ago`;
    }
  };

  const calculateUnit = (diff, unit) => {
    const result = Math.floor(diff / unit);
    return result;
  };

  return { timeDiffString };
};

export default useTime;
