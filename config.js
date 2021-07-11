import * as firebase from 'firebase'

require('@firebase/firestore')


  var firebaseConfig = {
    apiKey: "AIzaSyAgVTYYemtlNmad5_WeEMYbuFBnEz91LCA",
    authDomain: "wily-app-55a27.firebaseapp.com",
    projectId: "wily-app-55a27",
    storageBucket: "wily-app-55a27.appspot.com",
    messagingSenderId: "527238903114",
    appId: "1:527238903114:web:6d558c93068e3ea4753db3"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore()