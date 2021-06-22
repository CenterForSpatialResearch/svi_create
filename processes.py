from shapely.geometry import shape
from shapely.geometry import Polygon
from shapely.geometry import MultiPolygon
import json
import fiona 
files = [ "cityCouncil.geojson",
 "fireDivision.geojson",
"schoolDistrict.geojson",		
# "tract.geojson",
"policePrecinct.geojson",
"borough.geojson",		
"congressionalDistrict.geojson",	
# "stateAssemblyDistrict.geojson",
"policePrecinct.geojson"]#,		
#"stateSenate.geojson"]#,		
# "zipcode.geojson"]

#
# p1 = Polygon([(0,0), (1,1), (1,0)])
# p2 = Polygon([(0,1), (1,0), (1,1)])
#
# print(p1.intersects(p2))
#
# path = "shapefiles/nyad_21a/nyad.shp"
#
# c = fiona.open(path)
# pol = c.next()
# print(pol['properties'])
# geom = shape(pol['geometry'])
# print(geom)
# Multi = MultiPolygon([shape(pol['geometry']) for pol in fiona.open(path)])
#
#


def makePolygons():
    with open("centroids.geojson") as f:
        data = json.load(f)
        d = {}
        for i in range(len(data["features"])):
            fips = data["features"][i]["properties"]["FIPS"]
            centroid = data["features"][i]["geometry"]["coordinates"]
            #print (fips,centroid)
            d[fips]=centroid
        print (d)
makePolygons() 
#
# def getSinglePolygon(polygonString,coords):
#     for p in polygonString:
#         #print(len(p))
#         if len(p)==2 and type(p[0]) is not list:
#             coords.append(p)
#             #print (p)
#         else:
#             getSinglePolygon(p,coords)
#     return coords
#
# def flatten_json(y):
#     out = {}
#     test =[]
#     def flatten(x, name=''):
#         if type(x) is dict:
#             for a in x:
#                 flatten(x[a], name + a + '_')
#         elif type(x) is list:
#             i = 0
#             for a in x:
#                 flatten(a, name + str(i) + '_')
#                 i += 1
#         else:
#             out[name[:-1]] = x
#             test.append(x)
#
#     flatten(y)
#    # print(test)
#     print (out.keys())
#     return test
#     return out
#
# layerUniqueIds = {
#     "borough":"BoroName",
#     "zipcode":"ZIPCODE",
#     "policePrecinct":"Precinct",
#     "congressionalDistrict":"CongDist",
#     "stateAssemblyDistrict":"AssemDist",
#     "stateSenate":"StSenDist",
#     #"tract":"BoroCT2010",
#     "schoolDistrict":"SchoolDist",
#     "cityCouncil":"CounDist",
#     "fireDivision":"FireDiv"
# }
#
# polygonLayers = {}
# for f in files:
#     print (f)
#     layerName = f.split(".")[0]
#     polygonLayers[layerName]=makePolygons(f,layerUniqueIds[layerName])
#     #break
# #print (polygonLayers)
#
# intersections = {}
#
# links = []
# nodes = []
#
# dictionary = {}
#
# for i in polygonLayers:
#     print (i)
#     intersections[i]={}
#     layer1 = polygonLayers[i]
#
#
#     for l in layer1:
#         #print (l)
#         p1 = layer1[l]
#         intersections[i][l]={}
#        # if {"id":str(i)+"_"+str(l)} not in nodes:
#         nodes.append({"id":str(i)+"_"+str(l)})
#
#         dictionary[str(i)+"_"+str(l)]=[]
#
#         for j in polygonLayers:
#             #print (j)
#             if i!=j:
#                 intersections[i][l][j]=[]
#                 layer2 =  polygonLayers[j]
#                 for m in layer2:
#                     p2 = layer2[m]
#                     if p1.intersects(p2):
#
#                         link = {"source":str(i)+"_"+str(l),"target":str(j)+"_"+str(m)}
#                         dictionary[str(i)+"_"+str(l)].append(str(j)+"_"+str(m))
#                         if link not in links:
#                             links.append(link)
#
#
#                         intersections[i][l][j].append(m)
#
# #print(intersections)
# network ={"nodes":nodes,"links":links}
# print(len(nodes))#
# # with open('network_notracts.json', 'w') as outfile:
# #     json.dump(network, outfile)
#
# with open('node_dictionary.json', 'w') as outfile:
#     json.dump(dictionary, outfile)
##
# with open('intersections_2.json', 'w') as outfile:
#      json.dump(intersections, outfile)