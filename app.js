var nextnodecounter = 0;  
var xmldocstr;  
var correctanscounter = 0;  
var randmarrcnt = 0;  
var quesindex = 0;  
var getvalue;  
var ansarry = new Array();  
function UITest1() {  
	var xmlhttp;  
	if (window.XMLHttpRequest) {  
	    xmlhttp = new XMLHttpRequest();  
	}  
	else {  
	    xmlhttp = new
        ActiveXObject("Microsoft.XMLHTTP");  
    }  
    xmlhttp.onreadystatechange = function () { 
	    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {  
            var dataxml = xmlhttp.responseText;  
	        xmldocstr = loadXMLString(dataxml);  
		    displaychild(xmldocstr);  
		}  
	}  
	alert("Getting");
	xmlhttp.open("GET",
                 "data.xml", true);  
    xmlhttp.send();  
	alert("GOT");
}  
function OnSuccessCall(response) {  
}  
function OnErrorCall(response) {  
}  
function loadXMLString(str) {  
	if (window.DOMParser) {  
		parser = new DOMParser();  
		xmlDoc =
            parser.parseFromString(str, "text/xml");  
    }  
    else // Internet Explorer  
	{  
	    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");  
		xmlDoc.async = "false";  
		xmlDoc.loadXML(txt);  
	}  
	return xmlDoc;  
}  
var newxmldoc;  
function
displaychild(newxmldoc) {  
    // randomizeques(newxmldoc);  
    document.getElementById("nextButton").disabled = true;  
	if (document.getElementById("nextButton").innerHTML == "Show Result") {  
        document.getElementById("nextButton").disabled = false;  
        document.getElementById("nextButton").onclick=ShowResult();
    }  
    var questiontext =
        newxmldoc.getElementsByTagName("question");  
    var nodevalue1 =
        newxmldoc.getElementsByTagName("question_text")[nextnodecounter].childNodes[0].nodeValue;
    
    // display question text  
    document.getElementById("question").innerHTML = nodevalue1;  
	document.getElementById("options").innerHTML = "";  
	var answer = newxmldoc.getElementsByTagName("question_text");  
    var optiontext = newxmldoc.getElementsByTagName("option");  
    for (var anscount = 0; anscount < questiontext.length;
         anscount++) {  
        var indexofans= answer[anscount].getAttribute("answer");  
        ansarry[anscount] =
            questiontext[nextnodecounter].getElementsByTagName("option")[indexofans
                                                                         - 1].textContent;  
    }  
    //display radio buttons  
	for (i = 0; i < optiontext.length; i++) {  
	    //var nodevalue2 = "" +
        newxmldoc.getElementsByTagName("option")[i].childNodes[0].nodeValue;  
        var nodevalue2 =
            questiontext[nextnodecounter].getElementsByTagName("option")[i].textContent;
        
        var radioBtn = $('<li><input name="r1" type="radio" value="' +
                         nodevalue2 + '" onclick="enablebtn(this.value)" id="rbtnCount" ' + i +
                         ' /><label>' + nodevalue2 + '</label> </li>');  
        radioBtn.appendTo('#options');  
        checkradiobtn();  
	}  
}  
function FunNextNode() {  
	nextnodecounter = nextnodecounter + 1;  
	$("#wrapper").animate({ height:
                            '0px', opacity: '0.5' }, "fast");  
    $("#wrapper").promise().done(function () {  
    });  
	$("#wrapper").animate({ height: '150px', opacity: '1'
                          }, "slow");  
    $("#wrapper").promise().done(function () {  
    });  
	if (getvalue == ansarry[nextnodecounter]) {  
	    correctanscounter = correctanscounter + 1;  
	}  
	var questiontext =
        xmldocstr.getElementsByTagName("question");   
    if (questiontext.length == (nextnodecounter)) {  
        document.getElementById("nextButton").innerHTML = "Show
Result";  
    }  
    displaychild(xmldocstr);  
}  
function checkradiobtn()  
{  
	var radios =
        document.getElementsByTagName('input');  
    var value;  
    for (var i = 0; i < radios.length; i++) {  
	    if (radios[i].type == 'radio' && radios[i].checked) {  
		    document.getElementById("nextButton").disabled = true;  
        }
    }  
} 
var setvalue; 
function enablebtn(setvalue) {  
	document.getElementById("nextButton").disabled = false;  
    getvalue = setvalue;  
}  
function ShowResult() {  
	if (getvalue == ansarry[nextnodecounter-1]) {  
		correctanscounter = correctanscounter + 1;  
	}  
	document.getElementById("result").style.display="block";
    
    document.getElementById("noofques").innerHTML = nextnodecounter;  
    document.getElementById("noofcorans").innerHTML =
        correctanscounter;  
}  
// function to get random index of questions  
var tempcount = 0;  
var tempxmldoc;  
var randquearr = new Array();  
function randomizeques(tempxmldoc) {  
	var questiontext =
        tempxmldoc.getElementsByTagName("question");  
    var randomno = Math.floor((Math.random() * questiontext.length) +
                              1);  
    var tempnodevalue =
        tempxmldoc.getElementsByTagName("question_text")[randomno].childNodes[0].nodeValue;
    
    if (tempcount == 0) {  
        randquearr[randmarrcnt] = tempnodevalue;  
	    tempcount = tempcount + 1;  
		randmarrcnt = randmarrcnt + 1;  
	}  
	else {  
		for (var tempcnt = 0;
             tempcnt < randquearr.length; tempcnt++) {  
            if (randquearr[tempcnt] == tempnodevalue) {  
	            randomizeques(tempxmldoc);  
		    }  
		}  
		randquearr[randmarrcnt] =
            tempnodevalue;  
        randmarrcnt = randmarrcnt + 1;  
    }  
	quesindex = randomno;  
}  
