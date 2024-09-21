import json
import matplotlib.pyplot as plt
import seaborn as sns

#load json file
with open('11-11-2020Test1.json') as f:
    data = json.load(f)

groundtruth = [1,1,1,1,1,1,1,0,0,0,0,0,0,0]

correctDist = []
classes = []
for i in range(len(data)):
    correct = 0
    for j in range(14):
        response = data[i][str(j)]
        useRes = response["q1"]
        if useRes == groundtruth[j]:
            correct += 1
            
    correctDist.append(correct)

    if (i < 18):
        classes.append('MTurk Users')
    else:
        classes.append('Students/Friends')

classes = [x for _,x in sorted(zip(correctDist,classes))]
correctDist.sort()

x_pos = x_pos = [i for i, _ in enumerate(correctDist, 1)]
scatter = sns.scatterplot(x = x_pos, y = correctDist, hue = classes)
plt.ylabel('Number Correct')
plt.xlabel('Users')
plt.show()