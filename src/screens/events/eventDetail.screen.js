import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Checkbox } from 'react-native-paper';
import { Map } from '../../components/map/map.component';
import { SafeArea } from '../../components/safearea.component';
import { Label } from '../../components/typography/label.component';
import { theme } from '../../infrastructure/theme';
import { goback } from '../../navigation/navigate';
import { EventService } from '../../services/event/event.service';

export const EventDetailScreen = () => {
    
    const route = useRoute();
    const { id } = route.params;
    const [isLoading, setIsLoading] = useState(false)
    const [eventDetails, setEventDetails] = useState()
    const [includeGuests, setIncludeGuests] = useState(false)

    useEffect(() => {
      let isMounted = true


      const getEvent = async () => {
        try {
            setIsLoading(true)
            const response = await EventService.getOneEvent(id)
            if(response.success && isMounted){
                // console.log(response.data)
                setEventDetails(response.data)
            }

        } catch (err) {
            Alert.alert("Error Occurred", "Could not get the event")
        } finally {
            setIsLoading(false)
        }
      }

      getEvent();
    
      return () => {
        isMounted = false
      }
    }, [])

    const getDirections = () => {
        const scheme = Platform.select({
        ios: "maps:0,0?q=",
        android: "geo:0,0?q=",
        });
        const latLng = `${eventDetails?.lat},${eventDetails?.lng}`;
        const label = eventDetails?.eventPlace;
        const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
        });
        Linking.openURL(url);
    };
    

    return (
        <View style={styles.container}>
            <SafeArea>
            
                <KeyboardAwareScrollView >
                {
                    eventDetails && 
                    
                    <View>
                    <View
                        style={{
                        flexDirection: "row",
                        paddingLeft: 12
                        }}
                    >
                        <TouchableOpacity
                        onPress={goback}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                        activeOpacity={0.5}
                        >
                        <Ionicons name="arrow-back" size={35} color={"#111"} />
                        <Label
                            // size={"title"}
                            weight="bold"
                            style={{
                            fontSize: 16,
                            color: "#111",
                            justifyContent: "center",
                            }}
                        >
                            Events
                        </Label>
                        </TouchableOpacity>
                    </View>
                    <Image 
                    style={{
                        height: 130,
                        alignSelf: 'stretch',
                        marginHorizontal: 18,
                        borderRadius: 10
                    }}
                    source={{
                        uri: `https://www.german-emirates-club.com/uploads/sys/${eventDetails?.file}`}}/>
                    <View style={styles.innerContainer}>
                        <Label size={'heading'} style={{marginVertical: 8}} weight={'bold'}>
                            {eventDetails.eventName}
                        </Label>
                        <Label>
                        <MaterialCommunityIcons
                            color={theme.colors.ui.lightGray}
                            size={18}
                            name="calendar-clock-outline"
                        />
                            {` `+moment(eventDetails.eventTime).format("LLL")}
                        </Label>
                        <Label>
                        <MaterialCommunityIcons
                            color={theme.colors.ui.lightGray}
                            size={18}
                            name="map-marker"
                        />
                            {` `+eventDetails.eventPlace}
                        </Label>
                        <View style={{marginVertical: 16}}>
                            <Map
                                lat={eventDetails.lat}
                                lng={eventDetails.lng}
                                zoom={13}
                            />
                            <View
                                style={{
                                    flexDirection: "row",
                                    flex: 1,
                                }}
                                >
                                <Button
                                    mode="contained"
                                    labelStyle={{
                                    color: "#1282FF",
                                    fontWeight: "bold",
                                    }}
                                    contentStyle={{ height: 50 }}
                                    style={styles.mapButtons}
                                    onPress={getDirections}
                                >
                                    Get Directions
                                </Button>
                            </View>
                        </View>
                        
                        <Label>
                            {eventDetails.eventDescription}
                        </Label>
                        {
                            eventDetails && eventDetails.guests === 1 &&
                        
                            <View style={{ flexDirection: "row", alignItems: 'center', marginTop: 16 }}>
                                <Checkbox.Android
                                    status={includeGuests ? "checked" : "unchecked"}
                                    onPress={() => {
                                    setIncludeGuests(!includeGuests);
                                    }}
                                    uncheckedColor="black"
                                    color="black"
                                />
                                <Label>
                                    Include Guests
                                </Label>
                            </View>
                        }
                        <Button mode='contained'
                                style={{marginVertical: 16}}
                                color={theme.colors.icons.active}
                                contentStyle={{paddingVertical: 8}}
                                labelStyle={{fontWeight: 'bold', fontSize: 16}}
                                onPress={()=>{}}>Register</Button>
                    </View>
                    </View>
                }
                    
                </KeyboardAwareScrollView>
            </SafeArea>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    innerContainer: {
        paddingHorizontal: 16
    },
    mapButtons: {
    flex: 1,
    backgroundColor: "#ddd",
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
});