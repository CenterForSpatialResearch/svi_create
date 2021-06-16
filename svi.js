//This code does these following things
//draws map, add layer of counties
//color counties by overall svi
//recalculate overall svi each time checklist to left is clicked to check and uncheck
//color map with new sums
//sort list with new sums
//////////////////////////////////////////////////////////


//SECTION 1
//Setup variables, may still need some cleaning to get rid of unused ones
var map;
var pub = {
    all:null,
    min:999,
    max:0,    //
    startState:"NY",
    stateAllocations:null,
    currentState:"NY"
}
var minMaxDictionary = {}
var measures = ["EPL_POV","EPL_PCI","EPL_UNEMP","EPL_NOHSDP","EPL_AGE17","EPL_AGE65","EPL_DISABL","EPL_SNGPNT", "EPL_LIMENG","EPL_MINRTY","EPL_CROWD","EPL_GROUPQ","EPL_MOBILE", "EPL_MUNIT","EPL_NOVEH"]
pub["activeThemes"]=measures

var groups = {
    THEME1:["EPL_POV","EPL_PCI","EPL_UNEMP","EPL_NOHSDP"],
    THEME2:["EPL_AGE17","EPL_AGE65","EPL_DISABL","EPL_SNGPNT"],
    THEME3:["EPL_LIMENG","EPL_MINRTY"],
    THEME4:["EPL_GROUPQ","EPL_NOVEH","EPL_CROWD","EPL_MUNIT","EPL_MOBILE"]
}
var measureGroups = ["SPL_THEME1","SPL_THEME2","SPL_THEME3","SPL_THEME4"]

var toggleDictionary = {}
var tally = 0
//each theme's display name
var themeGroupDisplayText = {
    THEME1:"Socioeconomic Status",
    THEME2:"Household Composition & Disability",
    THEME3:"Minority Status & Language",
    THEME4:"Housing Type & Transportation"
}
var themeDisplayText = {
    "EPL_POV":"Persons below poverty estimate",
    "EPL_PCI":"Per capita income estimate",
    "EPL_UNEMP":"Civilian (age 16+) unemployed estimate",
    "EPL_NOHSDP":"Persons with no high school diploma (age25+) estimate",

    "EPL_AGE17":"Persons aged 17 and younger estimate",
    "EPL_AGE65":"Persons aged 65 and older estimate",
    "EPL_DISABL":"Civilian noninstitutionalized population with a disability estimate",
    "EPL_SNGPNT":"Single parent households with children under 18 estimate",


    "EPL_LIMENG":"of persons (age 5+) who speak English \"less than well\" estimate",
    "EPL_MINRTY":"minority (all persons except white, non - Hispanic) estimate",

    "EPL_CROWD":"households with more people than rooms estimate",
    "EPL_GROUPQ":"Persons in group quarters estimate",
    "EPL_MOBILE":"mobile homes estimate",
    "EPL_MUNIT":"housing in structures with 10 or more units estimate",
    "EPL_NOVEH":"households with no vehicle available estimate"

}

//colors for the lefthand checklist
var themeColors = {
    THEME1:"#87c8e1",
    THEME2:"#3d85a4",
    THEME3:"#4bacdd",
    THEME4:"#658994"
}

//this is the color scale for list on the right, it should match the map
var colorScale = d3.scaleLinear()
    .domain([0,measures.length/2,measures.length])
    .range(["green","gold","red"])

//END SECTION 1 ////////////////////////////////////////////////////////


//SECTION 2
//2 datasets/loading
// var counties = d3.json("NYCensusTract.geojson")
 var counties = d3.json("nyc.geojson")
var svi = d3.csv("SVINewYork2018_CensusTract.csv")


Promise.all([counties,svi])
.then(function(data){
    ready(data[0],data[1])
})
//END SECTION 2 ////////////////////////////////////////////////////////


//SECTION 3
//main function after loading data - everything stems from the ready function right now
function ready(counties,svi){

	//initial formatting of data
    var dataByFIPS = turnToDictFIPS(svi)
    var combinedGeojson = combineGeojson(dataByFIPS,counties)
    pub.all = combinedGeojson
//	console.log(counties)
	//console.log(combinedGeojson)

	//draw the map
	var map = drawMap(counties)

	//once everything is loaded, color the map
    map.once("idle",function(){ colorByPriority(map)})

	//set everything on the check list to true to start - all things are on and included in overall svi
    for(var n in measures){toggleDictionary[measures[n]]=true}
    d3.select("#activeThemesText").html("Showing sum of all "+pub.activeThemes.length+" themes.")


	//sort according to current state and draw the list of counties on the right accordingly
    var sorted = rankCounties()
    //join top 10 and bottom 10
    drawList (sorted);



	//for the leftside - draw each of the themes and the metrics under the themes
    for(var g in groups){//for each theme, add title
        var themeName = g
        var themeContent = groups[g]
            d3.select("#measures")
            .append("div")
            .attr("id",themeName)
            .html(themeName+": "+themeGroupDisplayText[themeName])

        for(var t in themeContent){//for each metric under theme, add the name of the metric

            d3.select("#measures")
            .append("div")
            .attr("id",themeContent[t])
            .attr("class","measureLable")
            .attr("theme",themeName)
            .html(themeDisplayText[themeContent[t]])
            .style("cursor","pointer")
            .style("background-color",themeColors[themeName])
            .on("click",function(){
                    var id = d3.select(this).attr("id")
					//console.log(id)
		            var themeGroup = d3.select(this).attr("theme")
					//whenever a metric is clicked, check if it is on or off currently, and toggle to opposite
	                if(toggleDictionary[id]==false){
	                    d3.select(this).style("background-color",themeColors[themeGroup])
	                    toggleDictionary[id]=true

	                }else{
	                    d3.select(this).style("background-color","#aaa")
	                    toggleDictionary[id]=false
	                }

					//recalculate the overal SVI accordingly
					//sort and update the list on the right of ranked counties
					//recolor the map
	                    calculateTally(toggleDictionary)
	                    // updateList(rankCounties())
                      drawList(rankCounties())
	                    colorByPriority(map)

            		})
        }
    }


}
//END SECTION 3 ////////////////////////////////////////////////////////


//SECTION 4
//these are all the functions that are called, see comments below for what each does

//these 3 functions below draws the ranked/sorted list to the right and updates it when something changes
function drawList(data){
    data = (data.slice(0,10)).concat(data.slice(-10))
    d3.select("#rankings svg").remove()
    var svg = d3.select("#rankings").append("svg").attr("width",200).attr("height",data.length*12+12)
    svg.selectAll(".ranked")
    .data(data)
    .enter()
    .append("text")
    .attr("class","ranked")
    .attr("id",function(d){return "_"+d.county})
    .attr("county",function(d){return d.county})
    .attr("x",function(d,i){return 20})
    //.attr("y",function(d,i){return parseInt(d.order)*12})
    .attr("y",function(d,i){return parseInt(data.indexOf(d))*12})
    .text(function(d,i){return (parseInt(d.order)+1)+". "+d.county+" "+ Math.round(d.tally*10000)/10000})
    .attr("transform","translate(0,20)")
    .attr("fill",function(d){
        return colorScale(d.tally)
    })
}
function updateList(data){
     var svg = d3.select("#rankings svg").data(data)//.append("svg").attr("width",200).attr("height",data.length*12)

    d3.selectAll(".ranked")//.remove()
    .data(data)
    .each(function(d,i){
       var c = d3.select(this).attr("county")

        d3.selectAll("#_"+d.county)
         .transition()
         .duration(1000)
         .delay(i*20)
         .attr("y",parseInt(data.indexOf(d))*12)
         // .attr("y",parseInt(d.order)*12)
        .attr("transform","translate(0,20)")
		.text(function(d){
			return (i+1)+". "+d.county+" "+Math.round(d.tally*10000)/10000
		})

    })
}

//ranks all counties by svi?
function rankCounties(){
    var countiesInState =[]
    for(var c in pub.all.features){
        var state = pub.all.features[c].properties["ST_ABBR"]
        if(state== pub.currentState){
			var countyFIPS =  pub.all.features[c].properties.countyFIPS
            var county = pub.all.features[c].properties.FIPS//.replace(countyFIPS,"")
            var tally = pub.all.features[c].properties.tally
            countiesInState.push({county:county,tally:tally})
        }
    }
    var sorted = countiesInState.sort(function(a,b){
        return parseFloat(b.tally)-parseFloat(a.tally)
    })
    for(var s in sorted){
        sorted[s]["order"]=s
    }
    console.log(sorted)
   return sorted
}


//this takes active themes and tallys the svi according to what is active
function calculateTally(toggleDictionary){
    pub["activeThemes"]=[]
    var activeThemesText = ""
    var index=0
    for(var t in toggleDictionary){
        if(toggleDictionary[t]==true){
            pub["activeThemes"].push(t)
            if(index!=0){
                activeThemesText+=" + "+t
            }else{
                activeThemesText+=t
            }
            index+=1

        }

    }
    if(pub.activeThemes.length==measures.length){
        d3.select("#activeThemesText").html("Showing sum of all "+pub.activeThemes.length+" themes.")

    }else{
        d3.select("#activeThemesText").html("Showing sum of "+pub.activeThemes.length+" themes.")
    }


    for(var i in pub.all.features){
        var tally = 0
        for(var t in toggleDictionary){
            if(toggleDictionary[t]==true){
                tally+=parseFloat(pub.all.features[i].properties[t])
            }

        }
        pub.all.features[i].properties["tally"]=parseFloat(tally)
    }
}

//this formats the datasets and combins them for use - needs to be adjusted for new data, definitedly need to be improved\
//converts svi to a Dictionary with FIPS as the key
function turnToDictFIPS(data){
    var fipsDict = {}
    for(var i in data){
      //need to change from FIPS to
        var fips = data[i]["FIPS"]
        //grab last 6 characters
        if(fips){
          fips = fips.substring(fips.length - 6)
          fipsDict[fips]=data[i]
        }

    }
    return fipsDict
}

//combine svi (i.e. all) with counties
function combineGeojson(all,counties){

  //get column names from first object
    var propertyKeys = Object.keys(all[Object.keys(all)[0]])
    // var propertyKeys = Object.keys(all[0])
    for(var p in propertyKeys){
        var pkey = propertyKeys[p]
        minMaxDictionary[pkey]={max:0,min:99999}
    }

    var excludeKeys = ["ST_ABBR","STATE","ST","AREA_SQMI","COUNTY","LOCATION"]

    for(var c in counties.features){

			var countyFIPS = counties.features[c].properties.STCNTY
	        var tractFIPS = counties.features[c].properties.FIPS.replace(countyFIPS,"")
	        var data = all[tractFIPS]
	        counties.features[c]["id"]=tractFIPS
	        //var population = counties.features[c].properties.totalPopulation
	        //for now PR is undefined
	        if(data!=undefined){
	            var keys = Object.keys(data)

	            for(var k in keys){
	                var key = keys[k]
	                 var value = data[key]
	                if(value!=-999 && value!=999 && excludeKeys.indexOf(key)==-1){
	                    value = parseFloat(value)
	                    if(value>minMaxDictionary[key].max){
	                        minMaxDictionary[key].max=value
	                    }
	                    if(value<minMaxDictionary[key].min){
	                        minMaxDictionary[key].min=value
	                    }
	                }
	                if(value==-999 || value==999){
	                    value = 0
	                }

	                if(isNaN(value)==false){
	                    value = parseFloat(value)
	                }
	                counties.features[c].properties[key]=value

	            }
	            counties.features[c].properties["tally"]=parseFloat(data["SPL_THEMES"])
	        }
		}
		//console.log(counties)
    return counties
}

//this draws the map, adds counties, and adds the pop up to the map
function drawMap(data){//,outline){
 //	console.log(data);

	//makes new map in the #map div
	d3.select("#map")
        .style("width",window.innerWidth+"px")
        .style("height",window.innerHeight+"px")
    mapboxgl.accessToken = "pk.eyJ1IjoiYzRzci1nc2FwcCIsImEiOiJja2J0ajRtNzMwOHBnMnNvNnM3Ymw5MnJzIn0.fsTNczOFZG8Ik3EtO9LdNQ"

    var maxBounds = [
      [-74.535258, 40.485374], // Southwest coordinates
      [-73.389334, 40.931799] // Northeast coordinates
    ];
    map = new mapboxgl.Map({
        container: 'map',
        style:"mapbox://styles/c4sr-gsapp/ckpwtdzjv4ty617llc8vp12gu",
        maxZoom:15,
        zoom: 10,
		center:[-73.87,40.656],
        preserveDrawingBuffer: true,
        minZoom:1,
        maxBounds: maxBounds
    });

	 //add a layer called counties from the geojson and
     map.on("load",function(){
        map.addControl(new mapboxgl.NavigationControl(),'bottom-right');
        map.dragRotate.disable();
        map.addSource("counties",{
             "type":"geojson",
             "data":data
         })

         map.addLayer({
             'id': 'counties',
             'type': 'fill',
             'source': 'counties',
             'paint': {
             'fill-color': "red",
                 'fill-opacity':1
             }
         });
       //	map.setFilter("counties",["==","stateAbbr","NY"])


		  //console.log(map.getStyle().layers)

     })


     var popup = new mapboxgl.Popup({
         closeButton: false,
         closeOnClick: false
     });



	 //detects mouse on counties layer inorder to get data for where mouse is
     map.on('mousemove', 'counties', function(e) {
         var feature = e.features[0]
		// console.log(feature)
         map.getCanvas().style.cursor = 'pointer';

         if(feature["properties"].FIPS!=undefined){



			 //this section just sets the x and y of the popup
             var x = event.clientX+20;
             var y = event.clientY+20;
             var w = window.innerWidth;
             var h = window.innerHeight;
             if(x+200>w){
                 x = x-280
             }
             if(y+200>h){
                 y= h-220
             }else if(y-200<150){
                 y = 150
             }

              d3.select("#mapPopup").style("visibility","visible")
              .style("left",x+"px")
              .style("top",y+"px")



            //this section sets the text content of the popup
             var countyName = feature["properties"]["COUNTY"]+" County, "+feature["properties"]["ST_ABBR"]
             var population = feature["properties"]["E_TOTPOP"]
             var displayString = countyName+"<br> Population: "+population+"<br>"
             var activeTally = 0
             var activeCount = 0
             for(var t in toggleDictionary){
                 if(toggleDictionary[t]==true){
                     activeTally+=feature.properties[t]
                      activeCount+=1
                 }
             }
             displayString+="sum of currently selected categories: "
			 	+Math.round(activeTally*10000)/10000
			 	+" out of possible "+ activeCount
             d3.select("#mapPopup").html(displayString)
         }

		 //when mouseleaves, popup is hidden
         map.on("mouseleave",'counties',function(){
             d3.select("#mapPopup").style("visibility","hidden")
         })

          });
          return map
}

//this is called when map is idle after first loading and then everytime the tally is changed
function colorByPriority(map){
	//console.log(pub.all)
    map.getSource('counties').setData(pub.all);
    map.setPaintProperty("counties", 'fill-opacity',1)

    var matchString = {
    property: "tally",
    stops: [[0,"#ddd"],[0.00001, "green"],[pub.activeThemes.length/2,"gold"],[pub.activeThemes.length, "red"]]
    }
    map.setPaintProperty("counties", 'fill-color', matchString)
    d3.select("#coverage").style("display","block")
}
//ENZ ////////////////////////////////////////////////////////
