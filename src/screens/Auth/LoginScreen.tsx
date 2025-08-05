import AppText from "@components/styled/AppText";
import { useEffect } from "react";
import { Text, View } from "react-native";

const LoginScreen = () => {

    useEffect(() => {
        console.log('hi')
    }, [])


    return (
        <View style={{flex: 1, backgroundColor: 'pink'}}>
            <Text>Logi2nScr3een</Text>
            <AppText>AppText</AppText>
            <AppText size="heading" isBold>AppText</AppText>
            <AppText size="heading">AppText</AppText>
        </View>
    )
}

export default LoginScreen;