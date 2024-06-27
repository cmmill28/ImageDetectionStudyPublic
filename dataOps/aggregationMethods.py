#
# Aggregation Models Test
#
# Author: Ryan Kemmer


import json
from itertools import combinations 
from statistics import mean

def tieCheck(x):
    if x.count(x[0]) == len(x):
        return True
    else:
        return False

def majorityVote(predictions):

    #specify binary decisions(1 for yes and 0 for no)
    choices = [1,0]
    #list to count majority votes
    choiceCounts = [0] * len(choices)

    #count each vote
    for i in range(len(choices)):
        for p in predictions:
            if p == choices[i]:
                choiceCounts[i] +=1

    #check to see if there is a tie
    tie = tieCheck(choiceCounts)
    #return winner (0 for No, 1 for yes, -1 for tie)
    if tie == False:
        ind = choiceCounts.index(max(choiceCounts))
        if ind == 0:
            winner = 1
        elif ind == 1:
            winner = 0
    else:
        winner = -1
    return winner


def confidenceWeightedVote(predictions, confidence):

    #specify binary decisions(1 for yes and 0 for no)
    choices = [1,0]
    #list to count confidence-weighted votes
    choiceCounts = [0] * len(choices)

    #count each vote and multiply confidence weights
    for i in range(len(choices)):
        for p in predictions:
            if p == choices[i]:
                conf = confidence[i]
                value = conf * .01
                choiceCounts[i] += value

    #check to see if there is a tie
    tie = tieCheck(choiceCounts)
    #return winner (0 for No, 1 for yes, -1 for tie)
    if tie == False:
        ind = choiceCounts.index(max(choiceCounts))
        if ind == 0:
            winner = 1
        elif ind == 1:
            winner = 0
    else:
        winner = -1
    return winner


def suprisinglyPopularVote(predictions, crowdPredictions):

    #specify binary decisions(1 for yes and 0 for no)
    choices = [1,0]
    #list to count majority votes
    choiceCounts = [0] * len(choices)
    #list to count majority of what people believed the majority to predict
    choiceCountsCrowd = [0] * len(choices)

    #count each vote to q1
    for i in range(len(choices)):
        for p in predictions:
            if p == choices[i]:
                choiceCounts[i] += 1

    #count each vote to q3
    for i in range(len(choices)):
        for p in crowdPredictions:
            if p == choices[i]:
                 choiceCountsCrowd[i] += 1

    #convert to percentages
    choiceCounts = [x/ len(predictions) for x in choiceCounts]
    choiceCountsCrowd = [x/ len(predictions) for x in choiceCountsCrowd]
    #find the percentage difference between the majority votes, 
    #and what the crowd believed the majority woulf predict
    differences = [m - n for m,n in zip(choiceCounts,choiceCountsCrowd)]

    #check to see if there is a tie
    tie = tieCheck(differences)
    #return winner (0 for No, 1 for yes, -1 for tie)
    if tie == False:
        ind = differences.index(max(differences))
        if ind == 0:
            winner = 1
        elif ind == 1:
            winner = 0
    else:
        winner = -1
    return winner



#
#main
# 

#load json file
with open('11-11-2020Test1.json') as f:
    data = json.load(f)

#specify ground truth for each question
groundtruth = [1,1,1,1,1,1,1,0,0,0,0,0,0,0]

num_samples = 2

#iterate through responses and calculate the results for each question
maj = []
conf = []
sup = []

for i in range(14):

    predictionTuple = [] 

    for userResponse in data:
        response = userResponse[str(i)]
        predictionTuple.append([response["q1"],response["q2"],response["q3"]])

    combinations_array = list(combinations(predictionTuple, num_samples))


    majresults = []
    confresults = []
    supresults = []

    for comb in combinations_array:
            
        predictions = [c[0] for c in comb]
        confidence = [c[1] for c in comb]
        crowdPredictions = [c[2] for c in comb]

        majanswer = majorityVote()

        #TODO: Fix this

            if (answer == groundtruth[i]):
                result[j] = 1
            else:
                result[j] = 0
            
        results.append(result)

    maj.append(mean(c[0] for c in results))
    conf.append(mean(c[1] for c in results))
    sup.append(mean(c[2] for c in results))




print(mean(maj))
print(mean(conf))
print(mean(sup))



'''
print('Question: ' + str(i))
print('Majority Winner: ' + str(majorityVote(predictions)))
print('Confidence-Weighted Winner: ' + str(confidenceWeightedVote(predictions, confidence)))
print('SP Winner: ' + str(suprisinglyPopularVote(predictions, crowdPredictions)))
print('Ground truth: ' + str(groundtruth[i]))
print()
'''