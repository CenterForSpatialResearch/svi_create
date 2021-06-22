//This code does these following things
//draws map, add layer of counties
//color counties by overall svi
//recalculate overall svi each time checklist to left is clicked to check and uncheck
//color map with new sums
//sort list with new sums
//////////////////////////////////////////////////////////

//TODO
//style popup with more info - rank and also individual categories
//do observations - make case studies

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
var colors = ["#005EB8","#F4AE00","#E4002B"]
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
    "EPL_POV":"% of population<span class=\"highlight\"> below poverty</span>",
    "EPL_PCI":"$<span class=\"highlight\"> Per capita income</span>",
    "EPL_UNEMP":"% of population<span class=\"highlight\"> unemployed</span>",
    "EPL_NOHSDP":"% of population<span class=\"highlight\"> with no high school diploma</span>",

    "EPL_AGE17":"% of population<span class=\"highlight\"> under 18</span>",
    "EPL_AGE65":"% of population<span class=\"highlight\">  over 64</span>",
    "EPL_DISABL":"% of population<span class=\"highlight\">  with a disability</span>",
    "EPL_SNGPNT":"% of<span class=\"highlight\"> single parent households</span>",


    "EPL_LIMENG":"% of population who speak <span class=\"highlight\">limited english</span>",
    "EPL_MINRTY":"% of population who are<span class=\"highlight\"> minorities</span>",

    "EPL_CROWD":"% of households with <span class=\"highlight\">more people than rooms</span>",
    "EPL_GROUPQ":"% of population in <span class=\"highlight\">group quarters</span>",
    "EPL_MOBILE":"% of housing are <span class=\"highlight\">mobile homes</span>",
    "EPL_MUNIT":"% of housing in <span class=\"highlight\">structures with 10+ units</span>",
    "EPL_NOVEH":"% of households with <span class=\"highlight\">no vehicle available</span>"

}
var measuresLabels = {
  TOTPOP:"Total Persons",
  HH:"Households",
  HU:"Housing Units",
AGE17:"under 18",
AGE65:"over 64",
DISABL:"with a disability",
LIMENG:"who speak limited English",
CROWD:"with more people than rooms",
GROUPQ:"in group quarters",
MINRTY:"who are Minorities",
MOBILE:"that are Mobile homes",
MUNIT:"in structures with 10+ units",
NOHSDP:"with no high school diploma",
NOVEH:"with no vehicle available",
PCI:"Per capita income",
POV:"below poverty",
SNGPNT:"have a single parent w/children under 18",
UNEMP:"unemployed"
}


var themeDisplayTextFull = {
    "EPL_POV":"Persons below poverty",
    "EPL_PCI":"Per capita income",
    "EPL_UNEMP":"Civilian (age 16+) unemployed",
    "EPL_NOHSDP":"Persons with no high school diploma (age25+)",

    "EPL_AGE17":"Persons aged 17 and younger",
    "EPL_AGE65":"Persons aged 65 and older",
    "EPL_DISABL":"Civilian noninstitutionalized population with a disability",
    "EPL_SNGPNT":"Single parent households with children under 18",


    "EPL_LIMENG":"of persons (age 5+) who speak English \"less than well\"",
    "EPL_MINRTY":"minority (all persons except white, non - Hispanic)",

    "EPL_CROWD":"households with more people than rooms",
    "EPL_GROUPQ":"Persons in group quarters",
    "EPL_MOBILE":"mobile homes",
    "EPL_MUNIT":"housing in structures with 10 or more units",
    "EPL_NOVEH":"households with no vehicle available"

}

//colors for the lefthand checklist
var themeColors = {
    THEME1:"#aaaaaa",
    THEME2:"#3d85a4",
    THEME3:"#4bacdd",
    THEME4:"#658994"
}


var width = 250;
var data = [
	{"color":colors[0],"value":0},
	{"color":colors[0],"value":width/5},
	{"color":colors[1],"value":width/2},
	{"color":colors[2],"value":width/5*4},
	{"color":colors[2],"value":width}
];
var extent = d3.extent(data, d => d.value);
var padding = 5;
var innerWidth = width - (padding * 2);
var barHeight = 5;
var height = 25;

//this is the color scale for list on the right, it should match the map
var colorScale = d3.scaleLinear()
    .range(colors)
    .domain([0,measures.length/2,measures.length])

var svg = d3.select("#key")
.append("svg").attr("width", width).attr("height", height)//.attr("id", "footerKey");
var g = svg.append("g");
svg.append("text")
	.text("High SVI")
	.attr("x",250)
	.attr("y",15)
	.attr("text-anchor","end")
	.style("font-size","10px")
	.style("fill",colors[2])
	.style("font-weight","bold")
	.style("letter-spacing","1px")
svg.append("text")
	.text("Low SVI")
	.attr("x",0).attr("y",15)
	.style("font-size","10px")
	.style("fill",colors[0])
	.style("font-weight","bold")
	.style("letter-spacing","1px")

var defs = svg.append("defs");
var linearGradient = defs.append("linearGradient").attr("id", "Gradient");
linearGradient.selectAll("stop")
    .data(data)
    .enter().append("stop")
    .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
    .attr("stop-color", d => d.color);

g.append("rect")
    .attr("width", 250)
    .attr("height", barHeight)
    .style("fill", "url(#Gradient)");


//END SECTION 1 ////////////////////////////////////////////////////////


//SECTION 2
//2 datasets/loading
// var counties = d3.json("NYCensusTract.geojson")
 var counties = d3.json("nyc.geojson")
var svi = d3.csv("SVINewYork2018_CensusTract.csv")


Promise.all([counties,svi])
Promise.all([counties])
.then(function(data){
    ready(data[0])
})
//END SECTION 2 ////////////////////////////////////////////////////////


//SECTION 3
//main function after loading data - everything stems from the ready function right now
function ready(counties){

	//initial formatting of data
 //   var dataByFIPS = turnToDictFIPS(svi)
    var tallied = combineGeojson(counties)
    pub.all = tallied//counties//combinedGeojson
//	console.log(counties)
	//console.log(combinedGeojson)

	//draw the map
	var map = drawMap(counties)
    var sorted = rankCounties()
    drawList (sorted);
	//once everything is loaded, color the map
    map.once("idle",function(){ colorByPriority(map)})

	//set everything on the check list to true to start - all things are on and included in overall svi
    for(var n in measures){toggleDictionary[measures[n]]=true}
    d3.select("#activeThemesText").html("Showing the sum of all "+pub.activeThemes.length+" variables.")


	//sort according to current state and draw the list of counties on the right accordingly
  



	//for the leftside - draw each of the themes and the metrics under the themes
    for(var g in groups){//for each theme, add title
        var themeName = g
        var themeContent = groups[g]
            d3.select("#measures")
            .append("div")
            .attr("id",themeName)
            .html(themeGroupDisplayText[themeName])
			.style("font-size","18px")
			.style("font-style","italic")
			.style('padding',"6px")
			.style('padding-top',"20px")

        for(var t in themeContent){//for each metric under theme, add the name of the metric

            var item = d3.select("#measures").append("div").attr("id",themeContent[t])
            .style("cursor","pointer")
			.style("margin-left","10px")
			
            item.append("div").attr("class","checkbox").attr("id","checkbox_"+themeContent[t])
			.style("display","inline-block")
			
            item.append("div").attr("class","check").attr("id","check_"+themeContent[t])
			.style("display","inline-block")
			
			
			
			item.append("div")
            .attr("id",themeContent[t])
			.style("display","inline-block")
            .attr("class","measureLable")
            .attr("theme",themeName)
			.html(themeDisplayText[themeContent[t]])
            .style("cursor","pointer")
			
			item.on("mouseover",function(){d3.select(this).style("background-color","yellow")})
			item.on("mouseout",function(){d3.select(this).style("background-color","#fff")})
            
			item.on("click",function(){
                    var id = d3.select(this).attr("id")
					
					//console.log(id)
		            var themeGroup = d3.select(this).attr("theme")
					//whenever a metric is clicked, check if it is on or off currently, and toggle to opposite
	                if(toggleDictionary[id]==false){
	                   // d3.select(this).style("background-color","#fff")//themeColors[themeGroup])
	                    d3.select(this).style("color","#000000")
						d3.select("#checkbox_"+id).style("border","#000000 1px solid")
						d3.select("#"+id).select(".highlight").style("color","#00B140")
	                    toggleDictionary[id]=true
						d3.select("#check_"+id).style("visibility","visible")
	                }else{
	                    d3.select(this).style("color","#aaa")
	                    toggleDictionary[id]=false
						d3.select("#check_"+id).style("visibility","hidden")
						d3.select("#"+id).select(".highlight").style("color","#aaaaaa")
						
						d3.select("#checkbox_"+id).style("border","#aaaaaa 1px solid")
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
    //console.log(Object.keys(data))
    data = data.filter(function(nullnum){
      return nullnum.tally !="-999" &&nullnum.tally!=0}) //filter out tally with -999
    var highs = data.slice(0,10)//
	var lows = data.slice(-10)
		d3.selectAll(".rankItem").remove()

		console.log(highs)
		console.log(lows)
   // d3.select("#rankings svg").remove()
		for(var i in highs){
			 d3.select("#high")
			.append("div")
			.attr("id",highs[i].county)
			.attr("class","rankItem")
			.attr("cursor","pointer")
			.html(//highs[i].order+". "
				highs[i].countyName.replace("Census ","").replace("County","").replace(", New York","")
				+"<strong>"+Math.round(highs[i].tally*100)/100+"</strong>"
		)
			.attr("cursor","pointer")
			.style("margin-left","10px")
			.on("mouseover",function(){
				var id = d3.select(this).attr("id")
				map.setFilter("hoverOutline",["==","FIPS",parseInt(id)])
			})
			.on("click",function(){
				var id = d3.select(this).attr("id")
				map.setFilter("hoverOutline",["==","FIPS",parseInt(id)])
				var centroid = centroids[id]
				map.flyTo({
					center: centroid,
					zoom:14
				});
			})
			
		}
		
		for(var i in lows){
			 d3.select("#low")
			.append("div")
			.attr("class","rankItem")
			.attr("id",lows[i].county)
			.html(//lows[i].order+". "
				lows[i].countyName.replace("Census ","").replace("County","").replace(", New York","")
				+"<strong>"+Math.round(lows[i].tally*100)/100+"</strong>"
			)
			.attr("cursor","pointer")
			.on("mouseover",function(){
				var id = d3.select(this).attr("id")
				map.setFilter("hoverOutline",["==","FIPS",parseInt(id)])
			})
			.style("margin-left","10px")
			.on("click",function(){
				var id = d3.select(this).attr("id")
				map.setFilter("hoverOutline",["==","FIPS",parseInt(id)])
				var centroid = centroids[id]
				map.flyTo({
					center: centroid,
					zoom:14
				});
			})
		}
   
   
    // var svg = d3.select("#rankings").append("svg").attr("width",200).attr("height",data.length*12+12)
 //    svg.selectAll(".ranked")
 //    .data(data)
 //    .enter()
 //    .append("text")
 //    .attr("class","ranked")
 //    .attr("id",function(d){return "_"+d.county})
 //    .attr("county",function(d){return d.county})
 //    .attr("x",function(d,i){return 20})
 //    //.attr("y",function(d,i){return parseInt(d.order)*12})
 //    .attr("y",function(d,i){return parseInt(data.indexOf(d))/2})
 //    //.text(function(d,i){return (parseInt(d.order)+1)+". Tract "+d.county.toString().slice(-6)+", "+d.countyName+" "+ Math.round(d.tally*10000)/10000})
 //    .text(function(d,i){return (parseInt(d.order)+1)+". "+d.countyName.slice(7,-16)+" "+ Math.round(d.tally*10000)/10000})
 //    .attr("transform","translate(0,20)")
 //    .attr("fill",function(d){
 //        return colorScale(d.tally)
 //    })
	
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
			var countyName =  pub.all.features[c].properties.LOCATION
            var county = pub.all.features[c].properties.FIPS//.replace(countyFIPS,"")
            var tally = pub.all.features[c].properties.tally
            countiesInState.push({county:county,tally:tally,countyName:countyName,data:pub.all.features[c].properties})
        }
    }
    var sorted = countiesInState.sort(function(a,b){
        return parseFloat(b.tally)-parseFloat(a.tally)
    })
    for(var s in sorted){
        sorted[s]["order"]=s
    }
    //console.log(sorted)
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
        d3.select("#activeThemesText").html("Showing the sum of all "+pub.activeThemes.length+" variables.")

    }else{
        d3.select("#activeThemesText").html("Showing the sum of "+pub.activeThemes.length+" variables.")
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
		// console.log(data[i])
		var county = data[i].COUNTY
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
function combineGeojson(counties){
//console.log(counties)
  //get column names from first object
    var propertyKeys = Object.keys(counties.features[0].properties)
    // var propertyKeys = Object.keys(all[0])
    for(var p in propertyKeys){
        var pkey = propertyKeys[p]
        minMaxDictionary[pkey]={max:0,min:99999}
    }

    var excludeKeys = ["ST_ABBR","STATE","ST","AREA_SQMI","COUNTY","LOCATION"]

    for(var c in counties.features){

			var countyFIPS = counties.features[c].properties.STCNTY
	        var tractFIPS = counties.features[c].properties.FIPS.replace(countyFIPS,"")
	        var data = counties.features[c].properties//all[tractFIPS]
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
      [-74.635258, 40.2485374], // Southwest coordinates
      [-73.289334, 40.931799] // Northeast coordinates
    ];
    map = new mapboxgl.Map({
        container: 'map',
        style:"mapbox://styles/c4sr-gsapp/ckpwtdzjv4ty617llc8vp12gu",
       // maxZoom:15,
        zoom: 9.7,
		    center:[-73.95, 40.7],
        preserveDrawingBuffer: true,
        minZoom:1,
        maxBounds: maxBounds
	 //  bearing: 28
    });

  var hoverCountyID = null;

	 // add a layer called counties from the geojson and
     map.on("load",function(){
        map.addControl(new mapboxgl.NavigationControl(),'bottom-right');
        map.dragRotate.disable();
        map.addSource("counties",{
             "type":"geojson",
             "data":data
         })
		 



// JIA: This is where I tried to add another hover outline layer
    
         map.addLayer({
             'id': 'counties',
             'type': 'fill',
             'source': 'counties',
             'paint': {
             'fill-color': "#fff",
                 'fill-opacity':1
             },
             "filter": ["!=", "E_TOTPOP", 0] // filter out no population
         },"water")
		 
     	//map.setFilter("counties",["==","stateAbbr","NY"])
          map.addLayer({
            'id': 'hoverOutline',
            'type': 'line',
            'source': 'counties',
            'layout': {},
            'paint': {
              'line-color': 'black',
              'line-width': 1
            }
          },"water")
			 map.setFilter("hoverOutline",["==","FIPS",""])
		  
      });
   
	 //detects mouse on counties layer inorder to get data for where mouse is
	  map.on("click","counties",function(e){
	  	var fips = e.features[0]["properties"].FIPS
		 var centroid = centroids[fips]
		  map.flyTo({
		 	 center: centroid,
			  zoom:13
		  });
	  })
     map.on('mousemove', 'counties', function(e) {
         var feature = e.features[0]
		// console.log(feature)
         map.getCanvas().style.cursor = 'pointer';

         if(feature["properties"].FIPS!=undefined){
		 	// console.log(feature["properties"])
			 
			 map.setFilter("hoverOutline",["==","FIPS",feature["properties"].FIPS])

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
			 
			 console.log(feature)

            //this section sets the text content of the popup
            var location = feature["properties"]["LOCATION"]
             //var countyName = feature["properties"]["COUNTY"]+" County, "+feature["properties"]["ST_ABBR"]
             var population = feature["properties"]["E_TOTPOP"]
             var displayString = "<b>"+location+"</b>" + "<br> Population: "+population+"<br>"
             var activeTally = 0
             var activeCount = 0
             for(var t in toggleDictionary){
                 if(toggleDictionary[t]==true){
                     activeTally+=feature.properties[t]
                      activeCount+=1
                 }
             }
			 if(Math.round(activeTally*10000)/10000==0){
	             displayString+="Not enough data for selected variables."
	             d3.select("#mapPopup").html(displayString)
				 
			 }else{
	             displayString+="SVI: "
				 	+Math.round(activeTally*10000)/10000
				 	+" out of "+ activeCount
	             d3.select("#mapPopup").html(displayString)
			 }
             
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
	console.log(pub.activeThemes)
    map.getSource('counties').setData(pub.all);
    map.setPaintProperty("counties", 'fill-opacity',1)
    var matchString = {
    property: "tally",
    stops: [
		[0,"#aaa"],
		[.000001, colors[0]],
		//[pub.activeThemes.length/5, colors[0]],
		[pub.activeThemes.length/2,colors[1]],
	//	[pub.activeThemes.length/5*4, colors[2]],
		[pub.activeThemes.length, colors[2]]
		]
    }
	
    map.setPaintProperty("counties", 'fill-color', matchString)
    d3.select("#coverage").style("display","block")
}
//ENZ ////////////////////////////////////////////////////////
