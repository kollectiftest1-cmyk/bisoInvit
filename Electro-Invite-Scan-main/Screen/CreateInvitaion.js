import React, { useEffect, useState } from 'react';
import { View, Text, TextInput,StyleSheet,TouchableOpacity,ScrollView} from 'react-native';
import InputCustum from '../components/InputCustum';
import ButtonCustom from '../components/ButtonCustom';
import { colors } from '../colors';
import * as SQLite from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';

const CreateInvitation = () => {
    const [invite, setInvite] = useState({})
    const [nom, setNom] = useState('')
    const [table, setTable] = useState('')
    const [numero, setNumero] = useState('')
    const [commentaire, setCommmentaire] = useState('')
    const [selectedOption, setSelectedOption] = useState({id :1,name :'Couple',nombre :2,});
    const navigation = useNavigation()    
    const parametres = [
            {
                id :1,
                name :'Couple',
                nombre :2,
            },
            {
                id :2,
                name :'Mme',
                nombre :1,
            },
            {
                id :3,
                name :'Mr',
                nombre :1,
            },
        ]
        const createDatabase = async () =>{
            const db = await SQLite.openDatabaseAsync('Invitations');
            
            // const resu = await db.runAsync('DELETE FROM Invitation', 100);
            // const result1 = await db.runAsync('CREATE TABLE IF NOT EXISTS Invitation (id TEXT PRIMARY KEY NOT NULL, statut TEXT NOT NULL, nbPersone INTEGER, nom TEXT NOT NULL,numero TEXT,tableInvt TEXT NOT NULL,commentaire TEXT)', 100);
        }
        // useEffect(()=>{
        //     createDatabase()
        // },[])
        const handeleSaveInBd = async () =>{
            try {
                const db = await SQLite.openDatabaseAsync('Invitations');
        // const db = await SQLite.openDatabaseAsync('databaseName');
        const date = new Date()
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        if (db) {
            
            await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS Invitation (id TEXT PRIMARY KEY NOT NULL, statut TEXT NOT NULL, nbPersone INTEGER, nom TEXT NOT NULL,numero TEXT,tableInvt TEXT NOT NULL,commentaire TEXT);
            CREATE TABLE IF NOT EXISTS venus (id TEXT PRIMARY KEY NOT NULL);
            INSERT INTO Invitation (id, statut, nbPersone, nom, numero, tableInvt, commentaire  ) VALUES ('${formattedDate}${nom}', '${selectedOption.name}',${parseInt(selectedOption.nombre)},'${nom}','${numero}','${table}','${commentaire}');
            `);
            await db.closeAsync()
            const dataQR = {
                id : `${formattedDate}${nom}`,
                statut :selectedOption.name,
                nbPersonne : parseInt(selectedOption.nombre),
                nom : nom,
                numero :numero,
                tableInvt :table,
                commentaire:commentaire
            }
            navigation.navigate('GenerateInvit',dataQR)
        }else{
            console.log('ERREUR CONNNEXION');
        }
            } catch (error) {
                console.log(error);
            }
            // const result = await db.runAsync('INSERT INTO Invitation (id, statut, nbPersone, nom, numero, tableInvt, commentaire  ) VALUES (?,?,?,?,?,?,?)', `${formattedDate}${nom}`, `${selectedOption.name}`,parseInt(selectedOption.nombre),`${nom}`,`${numero}`,`${table}`,`${commentaire}`);
//             console.log(result1.lastInsertRowId, result1.changes);
// console.log(result.lastInsertRowId, result.changes);
 }

  return (
    <ScrollView style={{width:'100%'}}
    
    >
    <View style={styles.container}>
        

      <Text style={styles.text}>Remplir le formulaire</Text>

    <View style={{flexDirection:'row',width:"100%",justifyContent:'center'}}>

      {
          
          parametres.map((item)=>(
              <TouchableOpacity 
              key={item.id}
              style={[styles.cartRegime,{
                backgroundColor:colors.backgroundsecond,borderColor:colors.textdetail},
                selectedOption.id === item.id && { backgroundColor: colors.constante.rose }                                 
            ]}
            onPress={() => setSelectedOption(item)}
            >
            <Text style={[styles.textCart,{color:colors.textdetail,fontSize:12} ]}>
                {item.name}
            </Text>
            </TouchableOpacity>    

))
}
</View>
      <View style={styles.textInputLabelContenaire}>
                  <Text style={[styles.textInputLabell,{color:colors.textInput}]} >Nom complet de l'invité</Text>
                  <InputCustum 
                      placehold='eg.Jordache Nzita'
                      styleInnput={[styles.input,{color:colors.textInput}]}
                      styleContenaire={[styles.contenaireSelfInput,{backgroundColor:colors.backgroundsecond}]}
                      placeholderTextColors={colors.placeholdcolor}
                      keyboardTyp='default'
                      textContentTyp='name'
                      value={`${nom}`}
                      onChange={(text)=> setNom(text)}
                      />
              </View>
              <View style={styles.textInputLabelContenaire}>
                  <Text style={[styles.textInputLabell,{color:colors.textInput}]} >Numero de l'invité</Text>
                  <InputCustum 
                      placehold='0892669552'
                      styleInnput={[styles.input,{color:colors.textInput}]}
                      styleContenaire={[styles.contenaireSelfInput,{backgroundColor:colors.backgroundsecond}]}
                      placeholderTextColors={colors.placeholdcolor}
                      keyboardTyp='phone-pad'
                      textContentTyp='telephoneNumber'
                      value={numero}
                      onChange={(text)=> setNumero(text)}
                      />
              </View>
              <View style={styles.textInputLabelContenaire}>
                  <Text style={[styles.textInputLabell,{color:colors.textInput}]} >Table de l'invité</Text>
                  <InputCustum 
                      placehold='eg.Matadi city 4'
                      styleInnput={[styles.input,{color:colors.textInput}]}
                      styleContenaire={[styles.contenaireSelfInput,{backgroundColor:colors.backgroundsecond}]}
                      placeholderTextColors={colors.placeholdcolor}
                      keyboardTyp='default'
                      textContentTyp='telephoneNumber'
                      value={table}
                      onChange={(text)=> setTable(text)}
                      />
              </View>
              <View style={[styles.textInputLabelContenaire,{width:'90%'}]}>
                  <Text style={[styles.textInputLabell,{color:colors.textInput}]} >Un petit commentaire</Text>
                  <View style={[{backgroundColor:colors.backgroundsecond,width:'100%',borderRadius:12}]}>
                    <TextInput
                      multiline
                      placeholder='Votre commentaire'
                      //   onChangeText={handleChangeText}
                      //   value={message}
                      style={[styles.input, {height:100,textAlignVertical:"top",margin:5, color:colors.textInput,fontFamily:'Comfortaa_400Regular', }]} 
                      value={commentaire}
                        onChangeText={(text) => setCommmentaire(text)}
                      />
                  </View>
              </View>
              <ButtonCustom
                  styledContainte={[styles.contenaireButtton,styles.buttonConnect,{backgroundColor:colors.constante.rose,paddingHorizontal:50,paddingVertical:10}]}
                  styledText={styles.textButton}
                  onPressing={handeleSaveInBd}
                  >
            
                      <Text style={styles.textButtton}>Envoyer</Text>

              </ButtonCustom>
    </View>
</ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
    fontWeight: 'bold',
    fontFamily:'Comfortaa_700Bold',
    paddingVertical:15
  },
  contenaireInput:{
    justifyContent: 'center',
    alignItems:'center',
    paddingTop:10
  },
  textInputLabelContenaire:{
    paddingBottom:5
  },
  textInputLabell:{
    fontFamily:'Comfortaa_300Light',
    fontSize:16,
    marginBottom:5,
  },
  contenaireSelfInput:{
    borderWidth:0,
    // padding:13
  },
  
  contenaireButtton:{
    borderRadius:12,
    overflow:'hidden',
    marginTop:8,
    marginBottom:10,
  
  },
  textButtton:{
    paddingHorizontal:65,
    paddingVertical:10,
    fontFamily:'Comfortaa_700Bold'
  },
  textCart:{
    fontFamily:'Comfortaa_300Light',
    textAlign:'center'
},
cartRegime:{
    width:"20%",
    flexDirection:'row',
    padding:0,
    overflow:'hidden',
    alignItems:'center',
    paddingHorizontal:12,
    // borderBottomWidth:1,
    justifyContent:'center',
    borderRadius:12,
    marginRight:10,
    marginBottom:12
  },
});

export default CreateInvitation;
