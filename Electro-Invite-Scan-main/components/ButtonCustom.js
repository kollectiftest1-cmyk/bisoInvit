import { StyleSheet, Text, View,Pressable } from 'react-native'
import React from 'react'

const ButtonCustom = ({children,styledContainte,styledText,onPressing}) => {
  return (
    <Pressable style={
        ({ pressed })=>[ pressed ? {transform:'0.3s,scale(0.96), 0.3s' }: {transform:'scale(1),0.3s' },
        styledContainte
      ]}
      onPress={onPressing}
      >
      <Text style={{...styledText}}>{children}</Text>
    </Pressable>
  )
}

export default ButtonCustom

// const styles = StyleSheet.create({})