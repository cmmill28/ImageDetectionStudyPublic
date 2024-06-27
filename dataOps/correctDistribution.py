import json
import matplotlib.pyplot as plt

#load json file
with open('11-11-2020Test1.json') as f:
    data = json.load(f)

#specify ground truth for each question
groundtruth = [1,1,1,1,1,1,1,0,0,0,0,0,0,0]
x_pos = [i for i, _ in enumerate(groundtruth, 1)]
print(x_pos)

correctAnswers = [0] * len(x_pos)
for user in data:
    correct = 0
    for i in range(14):
        response = user[str(i)]
        userAnswer = response["q3"]
        if userAnswer == groundtruth[i]:
            correct += 1
    
    correctAnswers[correct-1] += 1


print(correctAnswers)

plt.bar(x_pos, correctAnswers)
plt.ylabel('Number of Users')
plt.xlabel('Number of Correct Answers')
plt.show()