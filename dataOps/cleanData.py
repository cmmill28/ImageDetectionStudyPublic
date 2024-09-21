
import pymongo
import json
import sys

#url = 'mongodb://localhost:27017/'
url = 'mongodb://localhost:27014/'

dbase = sys.argv[1]
print(dbase)

client = pymongo.MongoClient(url)
db = client[dbase]
usersCol = db['users']
responsesCol = db['responses']

completed_users = []
userRemove = 0
args = len(sys.argv) - 1

for user in usersCol.find():

    key2pay = user["key2pay"]
    userName = user["user"]
    responseCount = responsesCol.count_documents({'user' : userName})

    print(userName + ": " + str(responseCount))
    if(responseCount == 14):
        completed_users.append(userName)
    else:
        userRemove += 1
        if(args > 1):
            if(sys.argv[2] == "delete"):
                responsesCol.delete_many({'user' : userName})
                usersCol.delete_one({'user' : userName})


print("Completed Users: " + str(len(completed_users)))
print("Users Removed: " + str(userRemove))




