import pymongo
import json
import time
import datetime
import sys

#url = 'mongodb://localhost:27017/'
url = 'mongodb://localhost:27014/'

dbase = sys.argv[1]
print("database: " + str(dbase))

client = pymongo.MongoClient(url)
db = client[dbase]
usersCol = db['users']
responsesCol = db['responses']

dataArray = []

for user in usersCol.find():

    userResponse = {}

    userName = user['user']
    print(userName)
    demographic = user["surveyResults"]

    userResponse["name"] = userName
    userResponse["demographic"] = demographic

    counter = 0
    for response in responsesCol.find({"user": userName}):
        userResponse[counter] = {
            "q1": response["q1"],
            "q2": response["q2"],
            "q3": response["q3"],
            "time": response["time"]
        }
        counter += 1 

    #for i in range(14):
        #response = responsesCol.find_one({"user": userName, "question": i})
        #userResponse[i] = {
            #"q1": response["q1"],
            #"q2": response["q2"],
            #"q3": response["q3"],
            #"time": response["time"]
        #}

    dataArray.append(userResponse)

rightNow = datetime.datetime.today().strftime('%m-%d-%Y')
file_name = rightNow + dbase + ".json" 

with open(str(file_name), 'w+') as outfile:
	json.dump(dataArray, outfile) 





