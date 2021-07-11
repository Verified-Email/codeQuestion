import React from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, ToastAndroid, TextInput} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import * as firebase from 'firebase'
import db from '../config.js'

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookId: '',
      scannedStudentId: ''
    }
  }
  getCameraPermissions = async(id)=>{
    const {status} = await Permissions.askAsync(Permissions.CAMERA)
    this.setState({
      //status === "granted" is true whenever user grants permission
      //status === "granted" is false whenever user doesn't grant permission
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    })
  }
  handleBarCodeScanned = async({type,data}) =>  {
    const {buttonState} = this.state
    if (buttonState === "BookID") {
      this.setState({
        scanned: true,
        scannedData: data,
        buttonState: 'normal'
      });
    }
    else if (buttonState === "StudentID") {
      this.setState({
        scanned: true,
        scannedData: data,
        buttonState: 'normal'
      });
    }
    
  }
  initiateBookIssue = async()=>{
    db.collection("transactions").add({
      'studentID': this.state.scannedStudentId,
      'bookID': this.state.scannedBookId,
      'transactionDate': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "issue"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability': false
    })
    db.collection("students").doc(this.scannedStudentId).update({
      'booksIssued': firebase.firestore.FieldValue.increment(1)
    })
    Alert.alert("Book Issued")

    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    })
  }

  initiateBookReturn = async()=>{
    db.collection("transactions").add({
      'studentID': this.state.scannedStudentId,
      'bookID': this.state.scannedBookId,
      'transactionDate': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "return"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability': true
    })
    db.collection("students").doc(this.scannedStudentId).update({
      'booksIssued': firebase.firestore.FieldValue.increment(-1)
    })
    Alert.alert("Book Returned")
    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    })
  }

  checkBookEligibility = async () => { 
    const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedBookId).get(); 
    var transactionType = ""; 
    if (bookRef.docs.length == 0) { 
      transactionType = false; 
    } 
    else { 
      bookRef.docs.map(doc => { var book = doc.data(); 
        if (book.bookAvailability) { 
          transactionType = "Issue"; 
        } 
        else { 
          transactionType = "Return"; 
        } 
      }); 
    } return transactionType; 
  };

  checkStudentElligibilityForBookIssue = async()=>{
    const studentRef = await db.collection("Students").where("studentID", "==", this.state.scannedStudentId).get()
    var isStudentElligible = ""
    if (studentRef.docs.lenght == 0) {
      this.setState({
        scannedStudentId: '',
        scannedBookId: ''
      })
      isStudentElligible = false
      Alert.alert("The Student ID Doesnt Exist In The Database!")
    }
    else {
      studentRef.docs.map((doc)=>{
        var student = doc.data()
        if (student.numberOfBooksIssued < 2) {
          isStudentElligible = true
        }
        else {
          isStudentElligible = false
          Alert.alert("The Student Has Already Issued Two Books!")
          this.setState({
            scannedStudentId: '',
            scannedBookId: ''
          })
        }
      })
    }
    return isStudentElligible
  }

  checkStudentElligibilityForReturn = async()=>{
    const transactionRef = await db.collection("Transaction").where("bookID", "==", this.state.scannedBookId).limit(1).get()
    var isStudentElligible = ""
    transactionRef.docs.map((doc)=>{
      var lastBookTransaction = doc.data()
        if (lastBookTransaction.studentId === this.state.scannedStudentId) {
          isStudentElligible = true
        }
        else{
          isStudentElligible = false
          Alert.alert("The Book Was Not Issued By The Student!")
          this.setState({
            scannedStudentId: '',
            scannedBookId: ''
        })
    }})
  return isStudentElligible
}

  handleTransaction = async()=>{
    var transactionType = await this.checkBookEligibility()
    console.log("transactionType", transactionType)
    if (!transactionType) {
      Alert.alert("The Book Doesnt Exist In The Library!")
      this.setState({
        scannedBookId: '',
        scannedStudentId: ''
      })
    }
    else if (transactionType === "Issue") {
      var isStudentElligible = await this.checkStudentElligibilityForBookIssue()
      if (isStudentElligible) {
        this.initiateBookIssue()
        Alert.alert("Book Issued To Student!")
      }
    }
    else {
      var isStudentElligible = await this.checkStudentElligibilityForReturn()
      if (isStudentElligible) {
        this.initiateBookReturn()
        Alert.alert("Book Returned To Library!")
      }
    }
  }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions

      const scanned = this.state.scanned
      const buttonState = this.state.buttonState

      if(buttonState !== "normal" && hasCameraPermissions) {
        return(
          <BarCodeScanner onBarCodeScanned = {scanned ? undefined: this.handleBarCodeScanned} style={StyleSheet.absoluteFillObject}/>
        );
      }
      else if(buttonState === "normal") {
        return(
          <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
            <View>
              <Image source={require("../assets/booklogo.jpg")}
               style={{width:200, height:200}}/>
              <Text style={{textAlign:'center', fontSize:30}}>
                Wireless Library App
              </Text>
            </View>
            <View style={styles.inputView}>
              <TextInput style={styles.inputBox} 
               placeholder="Book ID" onChangeText={text=>this.setState({scannedBookId: text})} value = {this.state.scannedBookId}/>
              <TouchableOpacity style={styles.scanButton} onPress={()=>{
                this.getCameraPermissions("BookID")
              }}>
                <Text styles={styles.buttonText}>
                  Scan
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
              <TextInput style={styles.inputBox} 
               placeholder="Student ID" onChangeText={text=>this.setState({scannedStudentId: text})} value = {this.state.scannedStudentId}/>
              <TouchableOpacity style={styles.scanButton} onPress={()=>{
                this.getCameraPermissions("StudentID")
              }}>
                <Text styles={styles.buttonText}>
                  Scan
                </Text>
              </TouchableOpacity>
              
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={async()=>{
              this.handleTransaction()
              this.setState({
                scannedBookId: '',
                scannedStudentId: ''
              })
            }}>
                <Text style={styles.submitButtonText}>
                  Submit
                </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
      );
    }
  }}

  const styles = StyleSheet.create(
    {
      container: {
        flex: 1,
        justifyContent: 'center',
        allignItems: 'center'
      },
      displayText: {
        fontSize: 15,
        textDecorationLine: 'underline'
      },
      scanButton: {
        backgroundColor: '#1f2c3d',
        padding: 10,
        margin: 10,
      },
      buttonText: {
        fontSize: 20,
        textAlign: 'center',
        marginTop: 10,
      },
      inputView: {
        flexDirection: 'row',
        margin: 20,
      },
      inputBox: {
        width: 200,
        height: 40,
        borderWidth: 1.5,
        borderRightWidth: 0,
        fontSize: 20
      },
      scanButton: {
        backgroundColor: '#a7f537',
        width: 50,
        borderWidth: 1.5,
        borderLeftWidth: 0
      },
      submitButton: {
        backgroundColor: '#187267',
        width: 100,
        height: 50
      },
      submitButtonText: {
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: "bold",
        color: 'white'
      }
    }  
  )
