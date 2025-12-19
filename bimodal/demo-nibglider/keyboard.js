/* 

1. PREVENT TAB AND SPACEBAR FROM AFFECTING WEB PAGE 

*/





// Add an event listener to the document
document.addEventListener('keydown', function (event) {
  // Check if the pressed key is the Tab key
  if (event.keyCode === 9) {
    // Prevent the default action (focusing the address bar)
    event.preventDefault();

  }
});



var shiftKeyWasDown = false;

window.onkeydown = function (event) {

  var elementLookup = document.getElementById(String(event.code))


  // highlight the key with active state
  // if it is non-alphanumeric.
  if ((elementLookup != null) && (event.metaKey == false)) {
    elementLookup.classList.add('active');
  }


};




window.onkeyup = function (event) {
  var elementLookup = document.getElementById(event.code)
  if (elementLookup != null) {
    elementLookup.classList.remove('active');
  }

}




function changeMode(modeString) {
  setUpPageAccordingToMode();
}


function setUpPageAccordingToMode() {


}


function loadXMLDocs() {

  /*
  const keyboardkeys = document.getElementsByClassName("RussianAlphabetKey");

  //console.log(keyboardkeys);

  var xmlhttpForAlphabetLetters = new XMLHttpRequest();
  
  var xmlhttpForOtherKeys = new XMLHttpRequest();

  
  
  // CLOSURE FOR XMLHTTPREQUEST STATE CHANGE
  xmlhttpForAlphabetLetters.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      processAlphabetLettersXMLDocumentFromXMLReq(this);
    }
  }; // END CLOSURE

  xmlhttpForAlphabetLetters.open("GET", "alphabetForKb.xml", true);
  xmlhttpForAlphabetLetters.send();

  

    // CLOSURE FOR XMLHTTPREQUEST STATE CHANGE
    xmlhttpForOtherKeys.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        processOtherKeysXMLDocumentFromXMLReq(this);
      }
    }; // END CLOSURE
  
  
    xmlhttpForOtherKeys.open("GET", "otherKeys.xml", true);
    xmlhttpForOtherKeys.send();
  
  */


}// END loadXMLDoc()


function processAlphabetLettersXMLDocumentFromXMLReq(xml) {
  var x, i, xmlDoc, txt;
  xmlDoc = xml.responseXML;
  txt = "";

  letters = xmlDoc.getElementsByTagName("letter");

  // console.log(letters);

  for (i = 0; i < letters.length; i++) {

    var pairingChars = letters[i].getAttribute('pairing');


    var letterType = letters[i].getAttribute('type');

    var kbCode = letters[i].getAttribute('keyboardCode');

    //        console.log(kbCode);
    var e = document.getElementById(String(kbCode));

    if (e != null) {

      e.innerHTML = String(pairingChars);
      if (letterType != null) {
        e.classList.add(String(letterType));
      }

    }
    //txt += x[i].childNodes[0].nodeValue + "<br>";


  }


}// END processAlphabetLettersXMLDocumentFromXMLReq



function processOtherKeysXMLDocumentFromXMLReq(xml) {

  var x, i, otherKeysXmlDoc, txt;
  otherKeysXmlDoc = xml.responseXML;
  txt = "";

  console.log(otherKeys);
  otherKeys = otherKeysXmlDoc.getElementsByTagName("key");

  // console.log(letters);

  for (i = 0; i < otherKeys.length; i++) {

    var standardCharacter = otherKeys[i].getAttribute('standardCharacter');
    var shiftCharacter = otherKeys[i].getAttribute('shiftCharacter');
    var kbCode = otherKeys[i].getAttribute('keyboardCode');

    //        console.log(kbCode);
    var e = document.getElementById(String(kbCode));

    if (e != null) {

      e.innerHTML = String(standardCharacter);

      /*
      // add class according to vowel or consonant
      if (letterType != null) {
        e.classList.add(String(letterType));
      }*/

    }
    //txt += x[i].childNodes[0].nodeValue + "<br>";


  }

}// END processAlphabetLettersXMLDocumentFromXMLReq








