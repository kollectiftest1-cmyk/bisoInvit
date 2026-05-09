import { Image, ImageBackground,StyleSheet, Text, View,useWindowDimensions, TouchableOpacity,ActivityIndicator } from 'react-native'
import React, { useRef, useState,useLayoutEffect } from 'react'
import {colors} from '../colors'
import QRCode from 'react-native-qrcode-svg';
import invitation from '../assets/0.png'
import mariage from '../assets/mariage.jpg'
import { AntDesign } from '@expo/vector-icons';
import ViewShot, {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
const GenerateInvit = () => {
    const withDevice = useWindowDimensions().width
    const [dataQrcode,setDataQrcode] = useState("bfl")    
    const ref = useRef();
    const dataQR = useRoute()
    const [accountByUser, setAccountByuser] = useState(null)
    const [showModalInfo, setShowModalInfo] = useState(false)
    const data = dataQR.params
    const handeleShowModalInfo = (etat) => {
        setShowModalInfo(etat)
        // console.log('bien fait')
    }

    useLayoutEffect(() => {
        setAccountByuser(dataQR.params)
       const dataStr = JSON.stringify(dataQR.params)
            setDataQrcode(dataStr)
        
    },[])



  const shareImage = async () => {
    try {
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        fileName:`QrCodeOf`
      });

      Sharing.shareAsync(uri)
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={[styles.contenaire,{}]}>
       <StatusBar   backgroundColor={colors.background}/>
        <View style={styles.contenaireAll}>
            <ViewShot ref={ref}>
                
                <View style={{height:'92%',width:withDevice-(withDevice*10/100),backgroundColor:'white',borderRadius:15,overflow:'hidden'}}
                >
        
                    <View style={{with:'100%',aspectRatio:'1.7/1'}}>
                        <Image
                            source={mariage}
                            style={{width:'100%',height:'100%'}}
                        />
                    </View>
                    <View style={{with:'100%',aspectRatio:'1690/1500'}}>
                        <ImageBackground
                            source={invitation}
                            style={{width:'100%',height:'100%',marginTop:'-29%',justifyContent:'flex-start'}}
                            >
                            <View style={{width:'100%',alignItems:'center',marginTop:'30%',}}>
                                <Text style={{fontFamily:'Comfortaa_300Light',fontSize:15}}>
                                    Hey, {data.statut && data.statut} {data.nom && data.nom} 
                                </Text>
                                <Text style={{fontFamily:'Comfortaa_400Regular',fontSize:15}}>
                                    Vous etes invité dans le mariage de
                                </Text>
                                <Text style={{fontFamily:'GreatVibes_400Regular',fontSize:35}}>
                                    Fortune et Biyaka
                                </Text>
                                <Text style={{fontFamily:'Comfortaa_700Bold',fontSize:16}}>
                                    12/07/2024  | 12:70
                                </Text>
                                <Text style={{fontFamily:'Comfortaa_700Bold',fontSize:16}}>
                                    Salle Victoria
                                </Text>
                                <Text style={{fontFamily:'Comfortaa_300Light',fontSize:12}}>
                                    ref : rompoint Kinkanda
                                </Text>

                                
                                

                            </View>


                        </ImageBackground>
                    </View>
                            <View style={[styles.contenaireQr,{marginTop:'-38%',}]}>
                                {dataQrcode === 'bfl' ? (
                                    <>
                                        <ActivityIndicator color={colors.constante.doree} size="large" style={{marginVertical:30}}/>
                                        <Text style={[styles.textCart,{color:colors.textdetail,textAlign:'center',marginBottom:10} ]}>Chargement...</Text>
                                    </>
                                ):(

                                    <QRCode
                                        value={dataQrcode}
                                        // logo={logo}
                                        logoSize={30}
                                        logoBackgroundColor='transparent'
                                        size={130}
                                        />
                                ) }
                            </View>
                            <View style={{alignItems:'center',marginTop:6}}>
                                <Text style={{fontFamily:'Comfortaa_300Light',fontSize:8}}>
                                    Attention l'invitation est unique et ne peut etre partagée
                                </Text>
                            </View>
                </View>
            </ViewShot>
            <View style={{flexDirection:"row",position:'absolute',bottom:"10%"}}>
                <TouchableOpacity  style={styles.shareQr}
                onPress={shareImage}
                >
                    <AntDesign name="sharealt" size={24} color={colors.backgroundsecond} />
                    {/* <Text style={[styles.textQr,{color:colors.textdetail}]}>Parteger mon Qr code</Text> */}

                </TouchableOpacity>
                <TouchableOpacity  style={styles.shareQr}
                onPress={shareImage}
                >
                    <AntDesign name="download" size={24} color={colors.backgroundsecond} />
                    {/* <Text style={[styles.textQr,{color:colors.textdetail}]}>Parteger mon Qr code</Text> */}

                </TouchableOpacity>
            </View>
        </View>
    </View>
  )
}

export default GenerateInvit

const styles = StyleSheet.create({
    contenaire:{
        flex:1,
        width:'100%',
        marginTop:'20%',
        height:'90%',
        // backgroundColor:'red'
    },

    contenaireAll:{
        flex:1,
        alignItems:'center',
        // justifyContent:'flex-start',
        width:'100%'
    },
    contenaireQr:{
        backgroundColor:"#f0629138",
        padding:20,
        // width:'60%',
        borderRadius:12,
        alignSelf:'center',
        // position:'absolute',
        // bottom:2
        
    },
    shareQr:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        paddingHorizontal:40,
        paddingVertical:3,
        backgroundColor:colors.constante.rose,
        borderRadius:12,
        marginRight:10
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

