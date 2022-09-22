import React from 'react'
import { Dimensions, ImageBackground, StatusBar, View } from 'react-native'
import { loginBGImage } from '../../utils/constants'

interface Props {
    children: React.ReactNode
}

//Functional Component
const Background: React.FC<Props> = ({children}) => {
    return (
        <ImageBackground
        style={{
            backgroundColor: 'black',
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          left: 0
        }}
        resizeMode="cover"
        source={loginBGImage}
      >
            <View style={{backgroundColor: "#00000099", flex: 1}}>
                {children}
            </View>
        </ImageBackground>
    )
}

export default Background