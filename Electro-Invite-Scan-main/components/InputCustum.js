import { Image, StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import React, { Children } from 'react'



const InputCustum = ({
    children,
    placehold,
    styleInnput,
    styleContenaire,
    placeholderTextColors,
    keyboardTyp,
    textContentTyp,
    secureTextEntr,
    enabled,
    value,
    onChange,
    ref,
    maxLength
    }) => {

    
  return (
    <View style={[styles.editContenaire,styleContenaire]}>
        <TextInput
            style={[styles.inputText,styleInnput]}
            placeholder={placehold}
            placeholderTextColor={placeholderTextColors}
            keyboardType={keyboardTyp}
            textContentType={textContentTyp}
            passwordRules={'*'}
            secureTextEntry={secureTextEntr}
            editable={enabled}
            value={value}
            onChangeText={onChange}
            ref={ref}
            maxLength={maxLength}
        />
        {children}
    </View>
  )
}

export default InputCustum

const styles = StyleSheet.create({
    editContenaire:{
        flexDirection:'row',
        alignItems:'center',
        width:'90%',
        height:40,
        borderWidth:1,
        borderRadius:10,
        marginBottom:9,
        
        // backgroundColor:'red'
    },
    inputText:{
        flex:1,
        fontSize:16,
        margin:10,
        fontFamily: 'Comfortaa_400Regular',
        color:'white'
        // backgroundColor:'red'
    },
})

